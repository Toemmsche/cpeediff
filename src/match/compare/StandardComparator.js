/*
    Copyright 2021 Tom Papke

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http=//www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

import {CallPropertyExtractor} from "../extract/CallPropertyExtractor.js";
import {VariableExtractor} from "../extract/VariableExtractor.js";
import {SizeExtractor} from "../extract/SizeExtractor.js";
import {Dsl} from "../../Dsl.js";
import {Lcs} from "../../lib/Lcs.js";
import {AbstractComparator} from "./AbstractComparator.js";
import {Config} from "../../Config.js";

export class StandardComparator extends AbstractComparator {

    callPropertyExtractor;
    variableExtractor;
    sizeExtractor;
    matching;

    constructor(matching) {
        super();
        this.callPropertyExtractor = new CallPropertyExtractor()
        this.variableExtractor = new VariableExtractor(this.callPropertyExtractor);
        this.sizeExtractor = new SizeExtractor();
        this.matching = matching;
    }

    sizeCompare(node, other) {
        return this.sizeExtractor.get(node) - this.sizeExtractor.get(other);
    }

    _compareCalls(node, other) {
        //extract properties
        const nodeProps = this.callPropertyExtractor.get(node);
        const otherProps = this.callPropertyExtractor.get(other);

        //extract modified variables
        const nodeModifiedVariables = this.variableExtractor.get(node).modifiedVariables;
        const otherModifiedVariables = this.variableExtractor.get(other).modifiedVariables;

        //extract read variables
        const nodeReadVariables = this.variableExtractor.get(node).readVariables;
        const otherReadVariables = this.variableExtractor.get(other).readVariables;

        const nodeEndpoint = nodeProps.endpoint;
        const otherEndpoint = otherProps.endpoint;

        /*
         The endpoint URL has to match exactly.
         This is reasonable as large chunks of the URL can equal despite the two calls serving a different semantic purpose.
         E.g. www.example.com/docs and www.example.com/doctors
         */
        let endPointComparisonValue = nodeEndpoint === otherEndpoint ? 0 : 1;
        if (nodeProps.label !== otherProps.label) {
            endPointComparisonValue += Config.COMPARATOR.LABEL_PENALTY;
        }
        if (nodeProps.method !== otherProps.method) {
            endPointComparisonValue += Config.COMPARATOR.METHOD_PENALTY;
        }

        //TODO really?
        //If the endpoint (including method and label) of two calls perfectly matches, we can assume they fulfill the same semantic purpose
        if(endPointComparisonValue === 0) {
            return endPointComparisonValue;
        }
        //normalize comparison value
        endPointComparisonValue = Math.min(endPointComparisonValue, 1);

        //compare modified and read variables
        let modifiedVariablesComparisonValue = this._setCompare(nodeModifiedVariables, otherModifiedVariables, endPointComparisonValue);
        let readVariablesComparisonValue = this._setCompare(nodeReadVariables, otherReadVariables, endPointComparisonValue);

        //weigh comparison values
        let contentCompareValue = endPointComparisonValue * Config.COMPARATOR.CALL_ENDPOINT_WEIGHT
            + modifiedVariablesComparisonValue * Config.COMPARATOR.CALL_MODVAR_WEIGHT
            + readVariablesComparisonValue * Config.COMPARATOR.CALL_READVAR_WEIGHT;

        //small penalty for code string inequality
        if (nodeProps.code !== otherProps.code) {
            contentCompareValue += Config.COMPARATOR.EPSILON_PENALTY;
        }

        return contentCompareValue;
    }

    _compareManipulates(node, other) {
        //extract modified variables
        const nodeModifiedVariables = this.variableExtractor.get(node).modifiedVariables;
        const otherModifiedVariables = this.variableExtractor.get(other).modifiedVariables;

        //extract read variables
        const nodeReadVariables = this.variableExtractor.get(node).readVariables;
        const otherReadVariables = this.variableExtractor.get(other).readVariables;

        let modifiedVariablesComparisonValue = this._setCompare(nodeModifiedVariables, otherModifiedVariables, 1);
        let readVariablesComparisonValue = this._setCompare(nodeReadVariables, otherReadVariables, modifiedVariablesComparisonValue);

        let contentCompareValue = Config.COMPARATOR.MANIPULATE_MODVAR_WEIGHT * modifiedVariablesComparisonValue + Config.COMPARATOR.MANIPULATE_READVAR_WEIGHT * readVariablesComparisonValue;

        //small penalty for code string inequality
        if (node.data !== other.data) {
            contentCompareValue += Config.COMPARATOR.EPSILON_PENALTY;
        }

        return contentCompareValue;
    }


    contentCompare(node, other) {
        //different labels cannot be matched
        if (node.label !== other.label) return 1.0;
        switch (node.label) {
            case Dsl.ELEMENTS.CALL.label: {
                return this._compareCalls(node, other);
            }
            case Dsl.ELEMENTS.MANIPULATE.label: {
                return this._compareManipulates(node, other);
            }
            case Dsl.ELEMENTS.ALTERNATIVE.label:
            case Dsl.ELEMENTS.LOOP.label: {
                //extract read variables
                const nodeReadVariables = this.variableExtractor.get(node).readVariables;
                const otherReadVariables = this.variableExtractor.get(other).readVariables;
                return this._setCompare(nodeReadVariables, otherReadVariables);
            }

            default: {
                return 0;
            }
        }
    }

    structCompare(node, other) {
        //TODO maybe use contentEquals()
        let compareLength = Config.COMPARATOR.PATH_COMPARE_RANGE;
        const nodePathSlice = node.path.reverse().slice(0, compareLength).map(n => n.label);
        const otherPathSlice = other.path.reverse().slice(0, compareLength).map(n => n.label);
        compareLength = Math.max(nodePathSlice.length, otherPathSlice.length);
        return 1 - (Lcs.getLCS(nodePathSlice, otherPathSlice).length / compareLength);
    }

    _setCompare(setA, setB, defaultValue = 1) {
        const maxSize = Math.max(setA.size, setB.size);
        let compValue;
        //if readVariables is empty, we cannot decide on similarity -> reuse endpoint comparison value
        if (maxSize === 0) {
            compValue = defaultValue;
        } else {
            let differentCounter = 0;
            for (const element of setA) {
                if (!setB.has(element)) {
                    differentCounter++;
                }
            }
            for (const element of setB) {
                if (!setA.has(element)) {
                    differentCounter++;
                }
            }
            compValue = differentCounter / maxSize;
        }
        return compValue;
    }

    matchCompare(node, other) {
        //TODO weigh nodes
        let commonCounter = 0;
        const nodeSet = new Set(node
            .toPreOrderArray()
            .slice(1)
            .filter(n => !n.isPropertyNode()));
        const otherSet = new Set(other
            .toPreOrderArray()
            .slice(1)
            .filter(n => !n.isPropertyNode()));
        for (const node of nodeSet) {
            if (this.matching.hasAny(node) && otherSet.has(this.matching.getOther(node))) {
                commonCounter++;
            }
        }

        return 1 - (commonCounter / Math.max(nodeSet.size, otherSet.size));
    }

    compare(node, other) {
        return Config.COMPARATOR.CONTENT_WEIGHT * this.contentCompare(node, other) + Config.COMPARATOR.STRUCTURE_WEIGHT * this.structCompare(node, other);
    }
}