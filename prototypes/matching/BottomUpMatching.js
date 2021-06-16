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

const {LCSSimilarity} = require("../lib/Lcs");
const {Globals} = require("../Config");
const {AbstractMatchingAlgorithm} = require("./AbstractMatchingAlgorithm");
const {Matching} = require("./Matching");
const {CpeeModel} = require("../cpee/CpeeModel");


class BottomUpMatching extends AbstractMatchingAlgorithm {


    constructor(options = []) {
        super(options, []);
    }

    static match(oldModel, newModel, matching = new Matching(), t = 0.1) {
        /*
               Step 4: Transform one-to-many (new to old) inner node matching into one-to-one matching.
                */
        matching.reduceNew((newInnerNode, matchSet) => {
            //choose the old node with the highest similarity value
            let maxSimilarityValue = 0;
            let maxSimilarityNode = null;
            for (const oldInnerNode of matchSet) {
                const similarityValue = matchingSimilarity(oldInnerNode, newInnerNode);
                if (similarityValue > maxSimilarityValue) {
                    maxSimilarityValue = similarityValue;
                    maxSimilarityNode = oldInnerNode;
                }
            }
            matchSet.clear();
            matchSet.add(maxSimilarityNode);
        });

        function matchingSimilarity(oldRootNode, newRootNode) {
            //divide size of set of common nodes by size of old subtree
            //only consider true descendants
            const oldSubTreePreOrder = new CpeeModel(oldRootNode).toPreOrderArray();
            const newSubTreePreOrder = new CpeeModel(newRootNode).toPreOrderArray();

            if (oldSubTreePreOrder.length === 0 || newSubTreePreOrder.length === 0) {
                return 0;
            }

            let commonSize = 0;
            for (const newNode of newSubTreePreOrder) {
                if (matching.hasNew(newNode) && oldSubTreePreOrder.includes(matching.getNewSingle(newNode))) {
                    commonSize++;
                }
            }

            return commonSize / oldSubTreePreOrder.length;
        }

        const newLeaves = newModel.leafNodes();
        const oldLeaves = oldModel.leafNodes();

        //The treshold t dictates how similar two leaf nodes have to be in order to be matched (Matching Criterion 1)
        for (const newLeaf of newLeaves) {
            //the minimum compare value
            let minCompareValue = 2;
            for (const oldLeaf of oldLeaves) {
                const compareValue = newLeaf.compareTo(oldLeaf);
                if (compareValue < minCompareValue && compareValue <= Globals.LEAF_SIMILARITY_THRESHOLD) {
                    minCompareValue = compareValue;
                    //Discard all matching with a higher comparison value
                    matching.unMatchNew(newLeaf);
                }
                if (compareValue <= Globals.LEAF_SIMILARITY_THRESHOLD) {
                    //Matching is as as good as previous best, save for now
                    matching.matchNew(newLeaf, oldLeaf);
                }
            }
        }

        matching.reduceNew((newLeafNode, matchSet) => {
            //turn into one-to-one matching according to matching criterion 2
            //compute LCS of paths
            const newPathArr = newLeafNode.path.map(n => n.label);
            let longestLCS = -1;
            let bestMatch = null;
            for (const oldLeafNode of matchSet) {
                const oldPathArr = oldLeafNode.path.map(n => n.label);
                const lcs = LCSSimilarity.getLCS(newPathArr, oldPathArr);
                //TODO more sophisticated similarity measure. LCS is not great
                if (lcs.length > longestLCS) {
                    bestMatch = oldLeafNode;
                    longestLCS = lcs.length;
                }
            }
            matchSet.clear();
            matchSet.add(bestMatch);
        });

        function matchingSimilarity(oldRootNode, newRootNode) {
            //divide size of set of common nodes by size of old subtree
            //only consider true descendants
            const oldSubTreePreOrder = new CpeeModel(oldRootNode).toPreOrderArray();
            const newSubTreePreOrder = new CpeeModel(newRootNode).toPreOrderArray();

            if (oldSubTreePreOrder.length === 0 || newSubTreePreOrder.length === 0) {
                return 0;
            }

            let commonSize = 0;
            for (const newNode of newSubTreePreOrder) {
                if (matching.hasNew(newNode) && oldSubTreePreOrder.includes(matching.getNewSingle(newNode))) {
                    commonSize++;
                }
            }

            return commonSize / Math.max(oldSubTreePreOrder.length, newSubTreePreOrder.length);
        }

        let moreMatches;
        do {
            moreMatches = false;
            for(const [newNode, oldMatchSet] of matching) {
                const match = oldMatchSet[Symbol.iterator]().next().value;
                if(!matching.hasNew(newNode.parent) && !matching.hasOld(match.parent)) {
                    if(newNode.parent.compareTo(match.parent) <= Globals.INNER_NODE_SIMILARITY_THRESHOLD
                        && matchingSimilarity(match.parent, newNode.parent) >= 0.5) {
                        matching.matchNew(newNode.parent, match.parent);
                        moreMatches = true;
                    }
                }
            }
        } while(moreMatches);


        return matching;
    }
}

exports.BottomUpMatching = BottomUpMatching;

