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
const {Lcs} = require("../lib/Lcs");
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
    match(oldModel, newModel, matching = new Matching(), comparator = new StandardComparator()) {
        //all nodes
        const oldNodes = oldModel.toPreOrderArray();
        const newNodes = newModel.toPreOrderArray();

        //leaf nodes
        const oldLeaves = oldModel.leafNodes();
        const newLeaves = newModel.leafNodes();

        //inner nodes sorted ascending by subtree size
        const oldInners = oldModel.innerNodes().sort((a, b) => a.toPreOrderArray().length - b.toPreOrderArray().length);
        const newInners = newModel.innerNodes().sort((a, b) => a.toPreOrderArray().length - b.toPreOrderArray().length);

        //root is always matched
        matching.matchNew(newModel.root, oldModel.root);

        //init script is always matched
        const oldFirstChild = oldModel.root.getChild(0);
        const newFirstChild = newModel.root.getChild(0);
        if (oldFirstChild.attributes.get("id") === "init") {
            if (newFirstChild.attributes.get("id") === "init") {
                matching.matchNew(newFirstChild, oldModel.root.getChild(0));
            }
        }

        //get obvious matches via hashing
        this._hashMatching(oldNodes, newNodes, matching);

        //match leaf nodes based on similarity
        this._leafSimilarityMatching(oldLeaves, newLeaves, matching, comparator);

        //match inner nodes based on (subtree) similarity
        this._innerNodesSimilarityMatching(oldInners, newInners, matching, comparator);

        //TODO matchSimilarUnmatched()

        //match properties of leaf nodes
        for (const newLeaf of newLeaves) {
            if (matching.hasNew(newLeaf)) {
                this._propertyMatching(matching.getNew(newLeaf), newLeaf, matching);
            }
        }

        matching._propagate();

        return matching;
    }

    _propertyMatching(oldNode, newNode, matching) {
        //We assume that no two properties that are siblings in the xml tree share the same label
        const oldLabelMap = new Map();
        for (const oldChild of oldNode) {
            oldLabelMap.set(oldChild.label, oldChild);
        }
        for (const newChild of newNode) {
            if (oldLabelMap.has(newChild.label)) {
                const match = oldLabelMap.get(newChild.label);
                matching.matchNew(newChild, match);
                this._propertyMatching(match, newChild, matching);
            }
        }
    }

    _hashMatching(oldNodes, newNodes, matching) {
        //filter for unmatched nodes and non-empty nodes
        oldNodes = oldNodes.filter(n => !matching.hasAny(n) && (n.hasAttributes() || n.data != null || n.hasChildren()));
        newNodes = newNodes.filter(n => !matching.hasAny(n) && (n.hasAttributes() || n.data != null || n.hasChildren()));

        //build hash map using old nodes
        const hashMap = new Map();
        for (const oldNode of oldNodes) {
            hashMap.set(oldNode.hash(), oldNode);
        }

        //probe hash map with new nodes
        for (const newNode of newNodes) {
            const hash = newNode.hash();
            if (hashMap.has(hash)) {
                matching.matchNew(newNode, hashMap.get(hash));
            }
        }
    }

    _leafSimilarityMatching(oldLeaves, newLeaves, matching, comparator) {
        //filter leaves for unmatched nodes
        oldLeaves = oldLeaves.filter(n => !matching.hasAny(n));
        newLeaves = newLeaves.filter(n => !matching.hasAny(n));

        //Only matchings of nodes with the same label are allowed
        const oldLabelMap = new Map();
        for (const oldLeaf of oldLeaves) {
            if (!oldLabelMap.has(oldLeaf.label)) {
                oldLabelMap.set(oldLeaf.label, []);
            }
            oldLabelMap.get(oldLeaf.label).push(oldLeaf);
        }

        for (const newLeaf of newLeaves) {
            if (oldLabelMap.has(newLeaf.label)) {
                //the minimum compare value
                let minCompareValue = 1;
                let minCompareNode = null;
                for (const oldLeaf of oldLabelMap.get(newLeaf.label)) {
                    const compareValue = comparator.compare(newLeaf, oldLeaf);
                    if (compareValue < minCompareValue) {
                        minCompareValue = compareValue;
                        minCompareNode = oldLeaf;
                    }
                }
                if (minCompareValue < Config.LEAF_SIMILARITY_THRESHOLD) {
                    matching.matchNew(newLeaf, minCompareNode);
                }
            }
        }
    }

    _innerNodesSimilarityMatching(oldInners, newInners, matching, comparator) {
        //filter for unmatched nodes
        oldInners = oldInners.filter(n => !matching.hasAny(n));
        newInners = newInners.filter(n => !matching.hasAny(n));

        //Only matchings of nodes with the same label are allowed
        const oldLabelMap = new Map();
        for (const oldInner of oldInners) {
            if (!oldLabelMap.has(oldInner.label)) {
                oldLabelMap.set(oldInner.label, []);
            }
            oldLabelMap.get(oldInner.label).push(oldInner);
        }

        for (const newInner of newInners) {
            if (oldLabelMap.has(newInner.label)) {
                let minCompareValue = 1;
                let minCompareNode = null;
                for (const oldInner of oldLabelMap.get(newInner.label)) {
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
        }

        function matchingSimilarity(newNode, oldNode) {
            //TODO assign weight to nodes based on size
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
    }

}

exports.ChawatheMatching = ChawatheMatching;