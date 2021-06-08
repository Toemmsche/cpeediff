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

const {Lcs} = require("../utils/LongestCommonSubsequence");
const {AbstractComparator} = require("./AbstractComparator");

class StandardComparator extends AbstractComparator {

    _attributeMap;
    
    constructor() {
        super();
        this._attributeMap = new Map();
    }
    
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

                let maxSize = Math.max(node.modifiedVariables.size, other.modifiedVariables.size);
                let modifiedVariablesComparisonValue;
                //if modifiedVariables is empty, we cannot decide on similarity -> reuse endpoint comparison value
                if (maxSize === 0) {
                    modifiedVariablesComparisonValue = endPointComparisonValue;
                } else {
                    let differentCounter = 0;
                    for (const modifiedVariable of node.modifiedVariables) {
                        if (!other.modifiedVariables.has(modifiedVariable)) {
                            differentCounter++;
                        }
                    }
                    for (const otherModifiedVariable of other.modifiedVariables) {
                        if (!node.modifiedVariables.has(otherModifiedVariable)) {
                            differentCounter++;
                        }
                    }
                    modifiedVariablesComparisonValue = differentCounter / maxSize;
                }

                maxSize = Math.max(node.readVariables.size, other.readVariables.size);

                let readVariablesComparisonValue;
                //if readVariables is empty, we cannot decide on similarity -> reuse endpoint comparison value
                if (maxSize === 0) {
                    readVariablesComparisonValue = endPointComparisonValue;
                } else {
                    let differentCounter = 0;
                    for (const readVariable of node.readVariables) {
                        if (!other.readVariables.has(readVariable)) {
                            differentCounter++;
                        }
                    }
                    for (const otherReadVariable of other.readVariables) {
                        if (!node.readVariables.has(otherReadVariable)) {
                            differentCounter++;
                        }
                    }
                    readVariablesComparisonValue = differentCounter / maxSize;
                }

                //endpoint and modified variables have higher weights
                return endPointComparisonValue * 0.4 + modifiedVariablesComparisonValue * 0.4 + readVariablesComparisonValue * 0.2;
            }

            case "manipulate": {
                if (node.label !== other.label) {
                    return 1;
                }
                /*
                Comparison of two scripts is identical to comparison of two service calls minus the endpoint comparison
                 */
                let maxSize = Math.max(node.modifiedVariables.size, other.modifiedVariables.size);
                let modifiedVariablesComparisonValue;
                //if modifiedVariables is empty, we must return a pessimistic estimate
                if (maxSize === 0) {
                    modifiedVariablesComparisonValue = 1;
                } else {
                    let differentCounter = 0;
                    for (const modifiedVariable of node.modifiedVariables) {
                        if (!other.modifiedVariables.has(modifiedVariable)) {
                            differentCounter++;
                        }
                    }
                    for (const otherModifiedVariable of other.modifiedVariables) {
                        if (!node.modifiedVariables.has(otherModifiedVariable)) {
                            differentCounter++;
                        }
                    }
                    modifiedVariablesComparisonValue = differentCounter / maxSize;
                }

                maxSize = Math.max(node.readVariables.size, other.readVariables.size);

                let readVariablesComparisonValue;
                //if readVariables is empty, we cannot decide on similarity -> reuse endpoint comparison value
                if (maxSize === 0) {
                    readVariablesComparisonValue = modifiedVariablesComparisonValue;
                } else {
                    let differentCounter = 0;
                    for (const readVariable of node.readVariables) {
                        if (!other.readVariables.has(readVariable)) {
                            differentCounter++;
                        }
                    }
                    for (const otherReadVariable of other.readVariables) {
                        if (!node.readVariables.has(otherReadVariable)) {
                            differentCounter++;
                        }
                    }
                    readVariablesComparisonValue = differentCounter / maxSize;
                }

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
                const maxSize = Math.max(node.readVariables.size, other.readVariables.size);
                let readVariablesComparisonValue;
                //if readVariables is empty, we cannot decide on similarity -> reuse endpoint comparison value
                if (maxSize === 0) {
                    readVariablesComparisonValue = 0
                } else {
                    let differentCounter = 0;
                    for (const readVariable of node.readVariables) {
                        if (!other.readVariables.has(readVariable)) {
                            differentCounter++;
                        }
                    }
                    for (const otherReadVariable of other.readVariables) {
                        if (!node.readVariables.has(otherReadVariable)) {
                            differentCounter++;
                        }
                    }
                    readVariablesComparisonValue = differentCounter / maxSize;
                }

                return readVariablesComparisonValue;
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

    compare(node,other) {
        return 0.9 * this._contentCompare(node, other) + 0.1 * this._structCompare(node, other);
    }
}

exports.StandardComparator = StandardComparator