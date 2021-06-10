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

const {StandardComparator} = require("../compare/StandardComparator");
const {Lcs} = require("../utils/LongestCommonSubsequence");
const {Config} = require("../Config");
const {AbstractMatchingAlgorithm} = require("./AbstractMatchingAlgorithm");
const {Matching} = require("./Matching");
const {CpeeModel} = require("../cpee/CpeeModel");


class PathMatching extends AbstractMatchingAlgorithm {

    /**
     * Matches nodes in the two process models according to the matching algorithm
     * described by
     * Kyong-Ho et al., "An Efficient Algorithm to Compute Differences between Structured Documents", 2004
     * @param {CpeeModel} oldModel The old process model
     * @param {CpeeModel} newModel The new process model
     * @param matching
     * @param comparator
     *                                    The order the matching algorithms are applied in matters.
     * @return {Matching} A matching containing a mapping of nodes from oldModel to newModel
     */
    static match(oldModel, newModel, matching = new Matching(), comparator = new StandardComparator()) {
        //get all nodes, leaf nodes and inner nodes of the models
        const oldLeaves = oldModel.leafNodes();
        const newLeaves = newModel.leafNodes();

        /*
        Step 1: Match leaf nodes.
        */

        let start = new Date().getTime();
        //The treshold t dictates how similar two leaf nodes have to be in order to be matched (Matching Criterion 1)
        for (const newLeafNode of newLeaves) {
            //the minimum compare value
            let minCompareValue = 2;
            for (const oldLeafNode of oldLeaves) {
                const compareValue = comparator.compare(newLeafNode, oldLeafNode);
                let longestLCS = -1;
                if (compareValue < minCompareValue
                    && compareValue <= Config.LEAF_SIMILARITY_THRESHOLD) {
                    minCompareValue = compareValue;
                    // longestLCS = Lcs.getLCS(oldLeafNode.path, newLeafNode.path, (a,b) => a.label === b.label);
                    //Discard all matching with a higher comparison value
                    matching.unMatchNew(newLeafNode);
                    matching.matchNew(newLeafNode, oldLeafNode)
                }
            }
        }
        let end = new Date().getTime();
        console.log("matching leaves took " + (end - start) + "ms");
        console.log("leaves matched: " + matching.newToOldMap.size);

        /*
        Step 3: Match inner nodes.
         */
        start = new Date().getTime();
        //Every pair of matched leaf nodes induces a comparison of the respective node paths from root to parent
        //to find potential matches.
        for (const [newLeafNode, matchSet] of matching) {
            matchPathExperimental(matchSet[Symbol.iterator]().next().value, newLeafNode);
        }

        end = new Date().getTime();

        console.log("matching paths took " + (end - start) + "ms");

        function matchPath(oldLeafNode, newLeafNode) {
            //copy paths, reverse them and remove first element
            const newPath = newLeafNode.path.slice().reverse().slice(1);
            const oldPath = oldLeafNode.path.slice().reverse().slice(1);

            //index in newPath where last matching occurred
            let j = 0;
            for (let i = 0; i < oldPath.length; i++) {
                for (let k = j; k < newPath.length; k++) {
                    //does there already exist a match between the two paths?
                    if (matching.hasNew(newPath[k]) && oldPath.includes(matching.getNewSingle(newPath[k]))) {
                        //If so, we terminate to preserve ancestor order within the path
                        return;
                    } else if (comparator.compare(newPath[k], oldPath[i]) < Config.INNER_NODE_SIMILARITY_THRESHOLD) {
                        matching.matchNew(newPath[k], oldPath[i]);
                        //update last matching index to avoid a false positive of the first if branch in subsequent iterations
                        j = k + 1;
                        break;
                    }
                }
            }
        }


        function matchPathExperimental(oldLeafNode, newLeafNode) {
            //copy paths, reverse them and remove first element
            const newPath = newLeafNode.path.slice().reverse().slice(1);
            const oldPath = oldLeafNode.path.slice().reverse().slice(1);

            const lcs = Lcs.getLCS(newPath, oldPath, (a, b) => a.label === b.label, true);

            const newLcs = lcs.get(0);
            const oldLcs = lcs.get(1);

            //index in newPath where last matching occurred
            for (let i = 0; i < newLcs.length; i++) {
                if (comparator.compare(newLcs[i], oldLcs[i]) <= Config.INNER_NODE_SIMILARITY_THRESHOLD && !(matching.hasNew(newLcs[i] && oldPath.includes(matching.getNew(newLcs[i]))))) {
                    matching.matchNew(newLcs[i], oldLcs[i]);
                }
            }
        }

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

        if (!matching.hasNew(newModel.root)) {
            matching.matchNew(newModel.root, oldModel.root);
        }


        start = new Date().getTime();
        //match properties of leaf nodes
        for (const newLeaf of newLeaves) {
            if (matching.hasNew(newLeaf)) {
                matchProperties(newLeaf, matching.getNewSingle(newLeaf));
            }
        }
        end = new Date().getTime();
        console.log("matching properties took " + (end -start) + "ms");

        function matchProperties(newNode, oldNode) {
            //TODO bucket matching
            for (const newChild of newNode) {
                for (const oldChild of oldNode) {
                    //label equality is sufficient
                    if (newChild.label === oldChild.label) {
                        matching.matchNew(newChild, oldChild);
                        matchProperties(newChild, oldChild);
                    }
                }
            }
        }

        return matching;
    }
}

exports.PathMatching = PathMatching;