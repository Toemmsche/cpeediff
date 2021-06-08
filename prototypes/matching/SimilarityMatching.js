/*
    Copyright 2021 Tom Papke

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

const {HungarianAlgorithm} = require("../utils/HungarianAlgorithm");
const {LCSSimilarity} = require("../utils/LongestCommonSubsequence");
const {Globals} = require("../Config");
const {AbstractMatchingAlgorithm} = require("./AbstractMatchingAlgorithm");
const {Matching} = require("./Matching");
const {CpeeModel} = require("../cpee/CpeeModel");


class SimilarityMatching extends AbstractMatchingAlgorithm {


    constructor(options = []) {
        super(options, []);
    }

    static match(oldModel, newModel, matching = new Matching()) {
        const preOrderNew = newModel.toPreOrderArray();
        const preOrderOld = oldModel.toPreOrderArray();

        const sizeNew = preOrderNew.length;
        const sizeOld = preOrderOld.length;

        const newLeaves = newModel.leafNodes();
        const oldLeaves = oldModel.leafNodes();

        const innerNodesNew = preOrderNew.filter(n => n.hasChildren());
        const innerNodesOld = preOrderOld.filter(n => n.hasChildren());

        const maxSize = Math.max(sizeNew, sizeOld);
        //new nodes are row indices, old nodes are column indices
        const comparisonMatrix = new Array(maxSize);
        for (let i = 0; i < sizeNew; i++) {
            comparisonMatrix[i] = new Array(maxSize);
        }


        //compute leaf node similarity
        for (const newLeaf of newLeaves) {
            for (const oldLeaf of oldLeaves) {
                const newIndex = preOrderNew.indexOf(newLeaf);
                const oldIndex = preOrderOld.indexOf(oldLeaf);
                comparisonMatrix[newIndex][oldIndex] = newLeaf.compareTo(oldLeaf);
            }
        }

        //traverse inner nodes top Down
        for (let i = 0; i < maxSize; i++) {
            for (let j = 0; j < maxSize; j++) {
                if (i >= sizeNew || j >= sizeOld) {
                    comparisonMatrix[i][j] = 1;
                } else {
                    getSimilarity(i, j);
                }
            }
        }

        function getSimilarity(i, j) {
            if (comparisonMatrix[i][j] === undefined) {
                //actually compute similarity
                const newNode = preOrderNew[i];
                const oldNode = preOrderOld[j];

                if (!newNode.hasChildren() || !oldNode.hasChildren()) {
                    comparisonMatrix[i][j] = 1;
                } else {
                    const subTreePreOrderNew = newNode.toPreOrderArray().slice(1);
                    const subTreePreOrderOld = oldNode.toPreOrderArray().slice(1);

                    const maxSubTreeSize = Math.max(subTreePreOrderOld.length, subTreePreOrderNew.length);
                    const costMatrix = new Array(maxSubTreeSize)
                    for (let k = 0; k < maxSubTreeSize; k++) {
                        costMatrix[k] = new Array(maxSubTreeSize)
                    }
                    for (let k = 0; k < maxSubTreeSize; k++) {
                        for (let l = 0; l < maxSubTreeSize; l++) {
                            if (k >= subTreePreOrderNew.length || l >= subTreePreOrderOld.length) {
                                costMatrix[k][l] = 1;
                            } else {
                                costMatrix[k][l] = getSimilarity(i + k + 1, j + l + 1);
                            }
                        }
                    }
                    comparisonMatrix[i][j] = HungarianAlgorithm.match(costMatrix) * 0.7 + newNode.compareTo(oldNode) * 0.3;
                    comparisonMatrix[i][j] *= comparisonMatrix[i][j];
                }
            }
            //value is stored
            return comparisonMatrix[i][j];
        }

        //convert to matching
        for(const[i, j] of HungarianAlgorithm.matches(comparisonMatrix)) {
            if(comparisonMatrix[i][j] < Globals.LEAF_SIMILARITY_THRESHOLD) {
                const newNode = preOrderNew[i];
                const oldNode = preOrderOld[j];

                matching.matchNew(newNode, oldNode);
            }
        }

        //root is always matched
        if(!matching.hasNew(newModel.root)) {
            matching.matchNew(newModel.root, oldModel.root);
        }
        return matching;
    }

}

exports.SimilarityMatching = SimilarityMatching;

