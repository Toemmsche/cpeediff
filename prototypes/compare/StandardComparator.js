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

const {Lcs} = require("../lib/Lcs");
const {AbstractComparator} = require("./AbstractComparator");

class StandardComparator extends AbstractComparator {

    _attributeMap;
    
    constructor() {
        super();
        this._attributeMap = new Map();
    }

    //TODO extract dynamically
    _buildPropertyMap(node) {
        if(!this._attributeMap.has(node)) {
            const map = new Map(node.attributes.entries());
            this._attributeMap.set(node, map);
            buildRecursive(node);
            
            function buildRecursive(node) {
                if (node.data != null) { //lossy comparison
                    //retain full (relative) structural information in the nodes
                    map.set("./" + node.toPropertyPathString(), node.data);
                }

                //copy all values into new map
                for (const child of node.childNodes) {
                    buildRecursive(child, map);
                }
            }
        }
    }

    _contentCompare(node, other) {
        this._buildPropertyMap(node);
        this._buildPropertyMap(other);
        const nodeAttributes = this._attributeMap.get(node);
        const otherAttributes = this._attributeMap.get(other);
        
        switch (node.label) {
            case "call": {
                //we cannot possibly match a call with another node type
                if (node.label !== other.label) return 1.0;

                const thisEndpoint = nodeAttributes.get("endpoint");
                const otherEndpoint = otherAttributes.get("endpoint");
                const endPointLcsSimilarity = Lcs.getLCS(thisEndpoint, otherEndpoint).length
                    / Math.max(thisEndpoint.length, otherEndpoint.length);
                let endPointComparisonValue = 1 - endPointLcsSimilarity * endPointLcsSimilarity;
                if (nodeAttributes.get("./parameters/label") === otherAttributes.get("./parameters/label")) {
                    //TODO maybe use LCS, too
                    endPointComparisonValue *= 0.5;
                }
                if (nodeAttributes.get("./parameters/method") !== otherAttributes.get("./parameters/method")) {
                    endPointComparisonValue = Math.min( endPointComparisonValue + 0.1, 1);
                }

                let modifiedVariablesComparisonValue = this._setCompare(node.modifiedVariables, other.modifiedVariables, endPointComparisonValue);
                let readVariablesComparisonValue = this._setCompare(node.readVariables, other.readVariables, modifiedVariablesComparisonValue);

                //endpoint and modified variables have higher weights
                return endPointComparisonValue * 0.4 + modifiedVariablesComparisonValue * 0.4 + readVariablesComparisonValue * 0.2;
            }

            case "manipulate": {
                if (node.label !== other.label) {
                    return 1;
                }
                let modifiedVariablesComparisonValue = this._setCompare(node.modifiedVariables, other.modifiedVariables, 1);
                let readVariablesComparisonValue = this._setCompare(node.readVariables, other.readVariables, modifiedVariablesComparisonValue);

                return 0.7 * modifiedVariablesComparisonValue + 0.3 * readVariablesComparisonValue;
            }

            case "parallel": {
                if (node.label !== other.label) {
                    return 1;
                }
                let compareValue = 0;
                //wait attribute dictates the number of branches that have to finish until execution proceeds
                if (nodeAttributes.has("wait") && nodeAttributes.get("wait") !== otherAttributes.get("wait")) {
                    compareValue += 0.2;
                }
                return compareValue;
            }

            case "alternative":
            case "loop": {
                return this._setCompare(node.readVariables, other.readVariables);
            }

            default: {
                //for the remaining node types, a label equality is sufficient
                if(node.label === other.label) {
                    return 0;
                } else {
                    return 1;
                }
            }
        }
    }

    _structCompare(node, other) {
        //TODO compare nodes based on their position in the tree (path to root, neighbors, etc.) in CONSTANT time =>> no lcs
        if(node.parent == null || other.parent == null || node.parent.label === other.parent.label) {
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

    compare(node,other) {
        return 0.9 * this._contentCompare(node, other) + 0.1 * this._structCompare(node, other);
    }
}

exports.StandardComparator = StandardComparator