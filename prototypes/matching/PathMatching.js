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

        //Use buckets for each label
        const newLabelMap = new Map();
        const oldLabelMap = new Map();
        for (const newLeaf of newLeaves) {
            if (!newLabelMap.has(newLeaf.label)) {
                newLabelMap.set(newLeaf.label, []);
            }
            newLabelMap.get(newLeaf.label).push(newLeaf);
        }
        for (const oldLeaf of oldLeaves) {
            if (!oldLabelMap.has(oldLeaf.label)) {
                oldLabelMap.set(oldLeaf.label, []);
            }
            oldLabelMap.get(oldLeaf.label).push(oldLeaf);
        }
        for (const [label, newNodeList] of newLabelMap) {
            if (oldLabelMap.has(label)) {
                for (const newLeaf of newNodeList) {
                    //the minimum compare value
                    let minCompareValue = 2;
                    for (const oldLeaf of oldLabelMap.get(label)) {
                        const compareValue = comparator.compare(newLeaf, oldLeaf);
                        let longestLCS = -1;
                        if (compareValue < minCompareValue
                            //The treshold t dictates how similar two leaf nodes have to be in order to be matched (Matching Criterion 1)
                            && compareValue <= Config.LEAF_SIMILARITY_THRESHOLD) {
                            minCompareValue = compareValue;
                            // longestLCS = Lcs.getLCS(oldLeaf.path, newLeaf.path, (a,b) => a.label === b.label);
                            //Discard all matching with a higher comparison value
                            matching.unmatchNew(newLeaf);
                            matching.matchNew(newLeaf, oldLeaf)
                        }
                    }
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
        for (const [newLeaf, oldLeaf] of matching) {
            matchPathExperimental(oldLeaf, newLeaf);
        }

        end = new Date().getTime();

        console.log("matching paths took " + (end - start) + "ms");

        function matchPath(oldLeaf, newLeaf) {
            //copy paths, reverse them and remove first element
            const newPath = newLeaf.path.slice().reverse().slice(1);
            const oldPath = oldLeaf.path.slice().reverse().slice(1);

            //index in newPath where last matching occurred
            let j = 0;
            for (let i = 0; i < oldPath.length; i++) {
                for (let k = j; k < newPath.length; k++) {
                    //does there already exist a match between the two paths?
                    if (matching.hasNew(newPath[k]) && oldPath.includes(matching.getNew(newPath[k]))) {
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


        function matchPathExperimental(oldLeaf, newLeaf) {
            //copy paths, reverse them and remove first element
            const newPath = newLeaf.path.slice().reverse().slice(1);
            const oldPath = oldLeaf.path.slice().reverse().slice(1);

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

        if (!matching.hasNew(newModel.root)) {
            matching.matchNew(newModel.root, oldModel.root);
        }


        start = new Date().getTime();
        //match properties of leaf nodes
        for (const newLeaf of newLeaves) {
            if (matching.hasNew(newLeaf)) {
                matchProperties(newLeaf, matching.getNew(newLeaf));
            }
        }
        end = new Date().getTime();
        console.log("matching properties took " + (end - start) + "ms");

        function matchProperties(newNode, oldNode) {
            //We assume that no two properties that are siblings in the xml tree share the same label
            const oldLabelMap = new Map();
            for (const oldChild of oldNode) {
                oldLabelMap.set(oldChild.label, oldChild);
            }
            for (const newChild of newNode) {
                const match = oldLabelMap.get(newChild.label);
                matching.matchNew(newChild, match);
                matchProperties(newChild, match);
            }

        }

        return matching;
    }
}

exports.PathMatching = PathMatching;