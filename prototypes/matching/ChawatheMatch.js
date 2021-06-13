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


class ChawatheMatching extends AbstractMatchingAlgorithm {

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
                    let minCompareValue = 1;
                    let minCompareNode = null;
                    for (const oldLeaf of oldLabelMap.get(label)) {
                        const compareValue = comparator.compare(newLeaf, oldLeaf);
                        if (compareValue < minCompareValue) {
                            minCompareValue = compareValue;
                            // longestLCS = Lcs.getLCS(oldLeaf.path, newLeaf.path, (a,b) => a.label === b.label);
                            //Discard all matching with a higher comparison value
                            minCompareNode = oldLeaf;
                        }
                    }
                    if (minCompareValue < Config.LEAF_SIMILARITY_THRESHOLD) {
                        matching.matchNew(newLeaf, minCompareNode);
                    }
                }
            }
        }

        /*
        Step 3: Match inner nodes.
         */

        const newInnerNodes = newModel
            .toPreOrderArray()
            .filter(n => !n.isPropertyNode() && !newLeaves.includes(n))
            .sort((a, b) => a.toPreOrderArray().length - b.toPreOrderArray().length);
        const oldInnerNodes = oldModel
            .toPreOrderArray()
            .filter(n => !n.isPropertyNode() && !oldLeaves.includes(n))
            .sort((a, b) => a.toPreOrderArray().length - b.toPreOrderArray().length);

        for (const newInner of newInnerNodes) {
            let minCompareValue = 1;
            let minCompareNode = null;
            for (const oldInner of oldInnerNodes) {
                const compareValue = comparator.compare(newInner, oldInner) * 0.4 + 0.6 * matchingSimilarity(newInner, oldInner)
                if (compareValue < minCompareValue) {
                    minCompareNode = oldInner;
                    minCompareValue = compareValue;
                }
            }
            if (minCompareValue < Config.INNER_NODE_SIMILARITY_THRESHOLD) {
                matching.matchNew(newInner, minCompareNode);
            }
        }

        function matchingSimilarity(newNode, oldNode) {
            let commonCounter = 0;
            const newNodeSet = new Set(newNode
                .toPreOrderArray()
                .slice(1)
                .filter(n => !n.isPropertyNode()));
            const oldNodeSet = new Set(oldNode
                .toPreOrderArray()
                .slice(1)
                .filter(n => !n.isPropertyNode()));
            for (const node of newNodeSet) {
                if (matching.hasNew(node) && oldNodeSet.has(matching.getNew(node))) {
                    commonCounter++;
                }
            }

            return 1 - (commonCounter / Math.max(newNodeSet.size, oldNodeSet.size));
        }


        if (!matching.hasNew(newModel.root)) {
            matching.matchNew(newModel.root, oldModel.root);
        }

        //match properties of leaf nodes
        for (const newLeaf of newLeaves) {
            if (matching.hasNew(newLeaf)) {
                matchProperties(newLeaf, matching.getNew(newLeaf));
            }
        }

        function matchProperties(newNode, oldNode) {
            //We assume that no two properties that are siblings in the xml tree share the same label
            const oldLabelMap = new Map();
            for (const oldChild of oldNode) {
                oldLabelMap.set(oldChild.label, oldChild);
            }
            for (const newChild of newNode) {
                if (oldLabelMap.has(newChild.label)) {
                    const match = oldLabelMap.get(newChild.label);
                    matching.matchNew(newChild, match);
                    matchProperties(newChild, match);
                }
            }

        }

        //TODO matchSimilarUnmatched()


        matching._propagate();

        return matching;
    }
}

exports.ChawatheMatching = ChawatheMatching;