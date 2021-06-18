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

const {Dsl} = require("../Dsl");
const {CodeExtractor} = require("../extract/CodeExtractor");
const {VariableExtractor} = require("../extract/VariableExtractor");
const {PropertyExtractor} = require("../extract/PropertyExtractor");
const {Lcs} = require("../lib/Lcs");
const {AbstractComparator} = require("./AbstractComparator");

class StandardComparator extends AbstractComparator {

    propertyExtractor;
    codeExtractor;
    variableExtractor;
    matching;

    constructor(matching) {
        super();
        this.propertyExtractor = new PropertyExtractor();
        this.codeExtractor = new CodeExtractor();
        this.variableExtractor = new VariableExtractor(this.codeExtractor);
        this.matching = matching;
    }

    _compareCalls(node, other) {
        //we cannot possibly match a call with another node type
        if (node.label !== other.label) return 1.0;

        //extract properties
        const nodeProperties = this.propertyExtractor.get(node);
        const otherProperties = this.propertyExtractor.get(other);

        //extract modified variables
        const nodeModifiedVariables = this.variableExtractor.get(node).modifiedVariables;
        const otherModifiedVariables = this.variableExtractor.get(other).modifiedVariables;

        //extract read variables
        const nodeReadVariables = this.variableExtractor.get(node).readVariables;
        const otherReadVariables = this.variableExtractor.get(other).readVariables;

        const nodeEndpoint = node.attributes.get("endpoint");
        const otherEndpoint = other.attributes.get("endpoint");
        const endPointLcsSimilarity = Lcs.getLCS(nodeEndpoint, otherEndpoint).length
            / Math.max(nodeEndpoint.length, otherEndpoint.length);
        let endPointComparisonValue = 1 - endPointLcsSimilarity * endPointLcsSimilarity;
        if (nodeProperties.has("./parameters/label") && nodeProperties.get("./parameters/label") === otherProperties.get("./parameters/label")) {
            //TODO maybe use LCS, too
            endPointComparisonValue *= 0.5;
        }
        if (nodeProperties.get("./parameters/method") !== otherProperties.get("./parameters/method")) {
            endPointComparisonValue = Math.min(endPointComparisonValue + 0.1, 1);
        }

        let modifiedVariablesComparisonValue = this._setCompare(nodeModifiedVariables, otherModifiedVariables, endPointComparisonValue);
        let readVariablesComparisonValue = this._setCompare(nodeReadVariables, otherReadVariables, endPointComparisonValue);

        //endpoint and modified variables have higher weight
        let contentCompareValue = endPointComparisonValue * 0.4 + modifiedVariablesComparisonValue * 0.4 + readVariablesComparisonValue * 0.2;

        //small penalty for code string inequality
        if (this.codeExtractor.get(node) !== this.codeExtractor.get(other)) {
            contentCompareValue += 0.01;
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

        let contentCompareValue =  0.7 * modifiedVariablesComparisonValue + 0.3 * readVariablesComparisonValue;

        //small penalty for code string inequality
        if (this.codeExtractor.get(node) !== this.codeExtractor.get(other)) {
            contentCompareValue += 0.01;
        }

       return contentCompareValue;
    }


    contentCompare(node, other) {
        //different labels cannot be matched
        if (node.label !== other.label) return 1.0;

        //extract properties
        const nodeProperties = this.propertyExtractor.get(node);
        const otherProperties = this.propertyExtractor.get(other);

        //extract read variables
        const nodeReadVariables = this.variableExtractor.get(node).readVariables;
        const otherReadVariables = this.variableExtractor.get(other).readVariables;

        switch (node.label) {
            case Dsl.KEYWORDS.CALL.label: {
                return this._compareCalls(node,other);
            }

            case Dsl.KEYWORDS.MANIPULATE.label: {
                return this._compareManipulates(node, other);
            }

            case Dsl.KEYWORDS.PARALLEL.label: {
                let compareValue = 0;
                //wait attribute dictates the number of branches that have to finish until execution proceeds
                if (nodeProperties.has("wait") && nodeProperties.get("wait") !== otherProperties.get("wait")) {
                    compareValue += 0.2;
                }
                return compareValue;
            }

            case Dsl.KEYWORDS.ALTERNATIVE.label:
            case Dsl.KEYWORDS.LOOP.label: {
                return this._setCompare(nodeReadVariables, otherReadVariables);
            }

            default: {
                return 0;
            }
        }
    }

    _structCompare(node, other) {
        //TODO compare nodes based on their position in the tree (path to root, neighbors, etc.) in CONSTANT time =>> no lcs
        if (node.parent == null || other.parent == null || node.parent.label === other.parent.label) {
            return 1;
        } else {
            return 0;
        }
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
        //TODO assign weight to nodes based on size
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
        if (node.isLeaf()) {
            return 0.9 * this.contentCompare(node, other) + 0.1 * this._structCompare(node, other);
        } else if (node.isInnerNode()) {
            return 0.8 * this.contentCompare(node, other) + 0.2 * this._structCompare(node, other);
        }

    }
}

exports.StandardComparator = StandardComparator