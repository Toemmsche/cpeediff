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
import {ElementSizeExtractor} from "../extract/ElementSizeExtractor.js";

export class StandardComparator extends AbstractComparator {

    callPropertyExtractor;
    variableExtractor;
    sizeExtractor;
    elementSizeExtractor;

    constructor() {
        super();
        this.callPropertyExtractor = new CallPropertyExtractor()
        this.variableExtractor = new VariableExtractor(this.callPropertyExtractor);
        this.sizeExtractor = new SizeExtractor();
        this.elementSizeExtractor = new ElementSizeExtractor();
    }

    fastElementSize(node) {
        return this.elementSizeExtractor.get(node);
    }

    _weightedAverage(items, weights) {
        let itemSum = 0;
        let weightSum = 0;
        for (let i = 0; i < items.length; i++) {
            if (items[i] != null) {
                itemSum += items[i] * weights[i];
                weightSum += weights[i];
            }
        }
        if (weightSum === 0) return 0;
        return itemSum / weightSum;
    }

    _compareLcs(seqA, seqB, defaultValue = null) {
        if(seqA == null || seqB == null) {
            return defaultValue;
        }
        const maxLength = Math.max(seqA.length, seqB.length);
        if (maxLength === 0) return defaultValue;
        return 1 - (Lcs.getLCS(seqA, seqB).length / maxLength);
    }

    _compareSet(setA, setB, defaultValue = null) {
        const maxSize = Math.max(setA.size, setB.size);
        //if readVariables is empty, we cannot decide on similarity
        if (maxSize === 0) return defaultValue;
        let commonCounter = 0;
        for (const element of setA) {
            if (setB.has(element)) {
                commonCounter++;
            }
        }
        return 1 - (commonCounter / maxSize);

    }

    _comparePqGrams(strA, strB, defaultValue = null) {
        if (strA == null || strB == null) return defaultValue;
        //TODO
        return this._compareLcs(Array.of(...strA), Array.of(...strB));
    }

    _compareCall(node, other) {
        //extract properties
        const nodeProps = this.callPropertyExtractor.get(node);
        const otherProps = this.callPropertyExtractor.get(other);


        //extract written variables
        const nodeWrittenVariables = this.variableExtractor.get(node).writtenVariables;
        const otherWrittenVariables = this.variableExtractor.get(other).writtenVariables;

        //extract read variables
        const nodeReadVariables = this.variableExtractor.get(node).readVariables;
        const otherReadVariables = this.variableExtractor.get(other).readVariables;


        //CV = Compare Value
        /*
         The endpoint URL has to match exactly for a perfect comparison value.
         This is reasonable as large chunks of the URL can equal despite the two calls serving a different semantic purpose.
         E.g. www.example.com/docs and www.example.com/doctors
         */
        const endPointCV = nodeProps.endpoint === otherProps.endpoint ? 0 : 1;
        const labelCV = this._comparePqGrams(nodeProps.label, otherProps.label);
        const methodCV = nodeProps.method === otherProps.method ? 0 : 1;
        const argCV = this._compareLcs(nodeProps.args, otherProps.args);

        const serviceCallCV = this._weightedAverage([endPointCV, labelCV, methodCV, argCV],
            [Config.COMPARATOR.CALL_ENDPOINT_WEIGHT,
                Config.COMPARATOR.CALL_LABEL_WEIGHT,
                Config.COMPARATOR.CALL_METHOD_WEIGHT,
                Config.COMPARATOR.CALL_ARGS_WEIGHT])
        //TODO really?
        //If the endpoint (including method, label and arguments) of two calls perfectly matches, we can assume they fulfill the same semantic purpose
        if (serviceCallCV === 0) {
            return serviceCallCV;
        }

        let codeCV = null;
        if (nodeProps.hasCode() || otherProps.hasCode()) {

            //compare written and read variables
            let writtenVariablesCV = this._compareSet(nodeWrittenVariables, otherWrittenVariables);
            let readVariablesCV = this._compareSet(nodeReadVariables, otherReadVariables);

            //weigh comparison values
            codeCV = this._weightedAverage([writtenVariablesCV, readVariablesCV], [Config.COMPARATOR.WRITTEN_VAR_WEIGHT, Config.COMPARATOR.READ_VAR_WEIGHT])

            //small penalty for code string inequality
            //TODO
            if (nodeProps.code !== otherProps.code) {
                codeCV += Config.COMPARATOR.EPSILON_PENALTY;
            }
        }
        //TODO
        const contentCV = this._weightedAverage([serviceCallCV, codeCV],
            [Config.COMPARATOR.CALL_SERVICE_WEIGHT,
                codeCV == null ? 0 : Config.COMPARATOR.CALL_CODE_WEIGHT])
        //TODO
        return Math.min(1, contentCV)
    }

    _compareManipulate(node, other) {
        //extract written variables
        const nodeWrittenVariables = this.variableExtractor.get(node).writtenVariables;
        const otherWrittenVariables = this.variableExtractor.get(other).writtenVariables;

        //extract read variables
        const nodeReadVariables = this.variableExtractor.get(node).readVariables;
        const otherReadVariables = this.variableExtractor.get(other).readVariables;

        let writtenVariablesCV = this._compareSet(nodeWrittenVariables, otherWrittenVariables);
        let readVariablesCV = this._compareSet(nodeReadVariables, otherReadVariables);

        let contentCV = this._weightedAverage([writtenVariablesCV, readVariablesCV],
            [Config.COMPARATOR.WRITTEN_VAR_WEIGHT, Config.COMPARATOR.READ_VAR_WEIGHT]);

        //small penalty for code string inequality
        if (node.text !== other.text) {
            contentCV += Config.COMPARATOR.EPSILON_PENALTY;
        }

        //TODO
        return Math.min(1, contentCV);
    }


    compareContent(node, other) {
        //different labels cannot be matched
        if (node.label !== other.label) return 1.0;
        switch (node.label) {
            case Dsl.ELEMENTS.CALL.label: {
                return this._compareCall(node, other);
            }
            case Dsl.ELEMENTS.MANIPULATE.label: {
                return this._compareManipulate(node, other);
            }
            case Dsl.ELEMENTS.ALTERNATIVE.label:
            case Dsl.ELEMENTS.LOOP.label: {
                //TODO compare text pqgram
                //extract read variables
                const nodeReadVariables = this.variableExtractor.get(node).readVariables;
                const otherReadVariables = this.variableExtractor.get(other).readVariables;
                return this._compareSet(nodeReadVariables, otherReadVariables);
            }

            default: {
                return 0;
            }
        }
    }

    comparePosition(node, other) {
        //TODO maybe use contentEquals()
        let compareLength = Config.COMPARATOR.PATH_COMPARE_RANGE;
        const nodePathSlice = node.path.reverse().slice(0, compareLength).map(n => n.label);
        const otherPathSlice = other.path.reverse().slice(0, compareLength).map(n => n.label);

        const posCV = this._compareLcs(nodePathSlice, otherPathSlice);
        return posCV;
    }


    compare(node, other) {
        const compareValue = this._weightedAverage([this.compareContent(node, other), this.comparePosition(node, other)],
            [Config.COMPARATOR.CONTENT_WEIGHT, Config.COMPARATOR.STRUCTURE_WEIGHT]);
        return compareValue;
    }

    compareSize(node, other) {
        return this.sizeExtractor.get(node) - this.sizeExtractor.get(other);
    }
}