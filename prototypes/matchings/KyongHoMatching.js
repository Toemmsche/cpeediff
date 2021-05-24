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

const {Globals} = require("../Global");
const {LCSSimilarity} = require("../utils/LCSSimilarity");
const {AbstractMatchingAlgorithm} = require("./AbstractMatchingAlgorithm");
const {Matching} = require("./Matching");
const {CPEEModel} = require("../CPEE/CPEEModel");


class KyongHoMatching extends AbstractMatchingAlgorithm {

    /**
     * Matches nodes in the two process models according to the matching algorithm
     * described by
     * Kyong-Ho et al., "An Efficient Algorithm to Compute Differences between Structured Documents", 2004
     * @param {CPEEModel} oldModel The old process model
     * @param {CPEEModel} newModel The new process model
     * @param {Matching} existingMatching An existing matching that is extended.
     *                                    The order the matching algorithms are applied in matters.
     * @param {number} t The comparison threshold. A higher threshold will lead to more, but potentially wrong matches
     * @return {Matching} A matching containing a mapping of nodes from oldModel to newModel
     */
    static match(oldModel, newModel, existingMatching = new Matching()) {
        //get all nodes, leaf nodes and inner nodes of the models
        const oldLeafNodes = oldModel.leafNodes();
        const newLeafNodes = newModel.leafNodes();

        //The two mappings from old to new and new told nodes respectively
        const oldToNewMap = existingMatching.oldToNewMap;
        const newToOldMap = existingMatching.newToOldMap;

        /*
        Step 1: Match leaf nodes.
        */

        //The treshold t dictates how similar two leaf nodes have to be in order to be matched (Matching Criterion 1)
        for (const newLeafNode of newLeafNodes) {
            //the minimum compare value
            let minCompareValue = 2;
            for (const oldLeafNode of oldLeafNodes) {
                const compareValue = newLeafNode.compareTo(oldLeafNode);
                if (compareValue < minCompareValue && compareValue <= Globals.LEAF_SIMILARITY_THRESHOLD) {
                    minCompareValue = compareValue;
                    //Discard all matchings with a higher comparison value
                    newToOldMap.set(newLeafNode, []);
                }
                if (compareValue <= Globals.LEAF_SIMILARITY_THRESHOLD) {
                    //Matching is as as good as previous best, save for now
                    newToOldMap.get(newLeafNode).push(oldLeafNode);
                }
            }
        }

        /*
        Step 2: Transform one-to-many (new to old) leaf node matchings  into one-to-one matchings
         */

        for (const [newLeafNode, matchArray] of newToOldMap) {
            if (matchArray.length > 1) {
                //turn into one-to-one matching according to matching criterion 2
                //compute LCS of paths
                const newPathArr = newLeafNode.path.map(n => n.label);
                let longestLCS = -1;
                let bestMatch = null;
                for(const oldLeafNode of matchArray) {
                    const oldPathArr = oldLeafNode.path.map(n => n.label);
                    const lcs = LCSSimilarity.getLCS(newPathArr, oldPathArr);
                    //TODO more sophisticated similarity measure. LCS is not great
                    if(lcs.length > longestLCS) {
                        bestMatch = oldLeafNode;
                        longestLCS = lcs.length;
                    }
                }
                matchArray.splice(0, matchArray.length, bestMatch);
            }
        }

        /*
        Step 3: Match inner nodes.
         */

        //Every pair of matched leaf nodes induces a comparison of the respective node paths from root to parent
        //to find potential matches.
        for (const [newLeafNode, oldMatchArray] of newToOldMap) {
            matchPath(oldMatchArray[0], newLeafNode);
        }

        function matchPath(oldLeafNode, newLeafNode) {
            //copy paths, reverse them and remove first element
            const newPath = newLeafNode.path.slice().reverse().slice(1);
            const oldPath = oldLeafNode.path.slice().reverse().slice(1);

            //index in newPath where last matching occurred
            let j = 0;
            for (let i = 0; i < oldPath.length; i++) {
                for (let k = 0; k < newPath.length; k++) {
                    //does there already exist a match between the two paths?
                    if (newToOldMap.has(newPath[k]) && oldPath.includes(newToOldMap.get(newPath[k])[0])) {
                        //If so, we terminate to preserve ancestor order
                        return;
                    } else if (newPath[k].compareTo(oldPath[i]) < Globals.INNER_NODE_SIMILARITY_THRESHOLD) {
                        //found new matching
                        if (!newToOldMap.has(newPath[k])) {
                            newToOldMap.set(newPath[k], []);
                        }
                        newToOldMap.get(newPath[k]).push(oldPath[i]);
                        //update last matching index to avoid a false positive of the first if branch in subsequent iterations
                        j = k + 1;
                    }
                }
            }
        }

        /*
        Step 4: Transform one-to-many (new to old) inner node matchings into one-to-one matchings.
         */
        for (const [newInnerNode, oldMatchArray] of newToOldMap) {
            if (oldMatchArray.size > 1) {
                //choose the old node with the highest similarity value
                let maxSimilarityValue = 0;
                let maxSimilarityNode = null;
                for (const oldInnerNode of oldMatchArray) {
                    const similarityValue = matchingSimilarity(oldInnerNode, newInnerNode);
                    if (similarityValue > maxSimilarityValue) {
                        maxSimilarityValue = similarityValue;
                        maxSimilarityNode = oldInnerNode;
                    }
                }
                oldMatchArray.splice(oldMatchArray.length);
                oldMatchArray.push(maxSimilarityNode);
            }
        }

        function matchingSimilarity(oldRootNode, newRootNode) {
            //divide size of set of common nodes by size of old subtree
            //only consider true descendants
            const oldSubTreePreOrder = new CPEEModel(oldRootNode).toPreOrderArray();
            const newSubTreePreOrder = new CPEEModel(newRootNode).toPreOrderArray();

            if (oldSubTreePreOrder.length === 0 || newSubTreePreOrder.length === 0) {
                return 0;
            }

            let commonSize = 0;
            for (const newNode of newSubTreePreOrder) {
                if (newToOldMap.has(newNode) && oldSubTreePreOrder.includes(newToOldMap.get(newNode))) {
                    commonSize++;
                }
            }

            return commonSize / oldSubTreePreOrder.length;
        }

        for (const [newNode, matchArray] of newToOldMap) {
            const oldNode = matchArray[0];
            if (!oldToNewMap.has(oldNode)) {
                oldToNewMap.set(oldNode, []);
            }
            oldToNewMap.get(oldNode).push(newNode);
        }

        return new Matching(oldToNewMap, newToOldMap);
    }
}

exports.KyongHoMatching = KyongHoMatching;