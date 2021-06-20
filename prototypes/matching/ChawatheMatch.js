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

const {HashExtractor} = require("../extract/HashExtractor");
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
    match(oldModel, newModel, matching = new Matching(), comparator = new StandardComparator(matching)) {
        //all nodes except properties
        const oldNodes = oldModel.toPreOrderArray().filter(n => !n.isPropertyNode());
        const newNodes = newModel.toPreOrderArray().filter(n => !n.isPropertyNode());

        //leaf nodes
        const oldLeaves = oldModel.leafNodes();
        const newLeaves = newModel.leafNodes();

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
        this._hashMatching(oldNodes, newNodes, matching, comparator);

        this._similarityMatching(oldNodes, newNodes, matching, comparator);

        this._matchSimilarUnmatched(matching, comparator);

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

    _hashMatching(oldNodes, newNodes, matching, comparator) {
        //filter for unmatched nodes and non-empty nodes
        oldNodes = oldNodes.filter(n => !matching.hasAny(n));
        newNodes = newNodes.filter(n => !matching.hasAny(n));

        const hashExtractor = new HashExtractor();

        //build hash map using old nodes
        const hashMap = new Map();
        for (const oldNode of oldNodes) {
            const hash = hashExtractor.get(oldNode);
            if (!hashMap.has(hash)) {
                hashMap.set(hash, []);
            }
            hashMap.get(hash).push(oldNode);
        }

        const oldToNewMap = new Map();
        //probe hash map with new nodes
        for (const newNode of newNodes) {
            const hash = hashExtractor.get(newNode);
            if (hashMap.has(hash)) {
                let minStructCompareValue = 2;
                let minStructCompareNode = null;
                for (const candidate of hashMap.get(hash)) {
                    //TODO remove
                    if(!newNode.contentEquals(candidate)) {
                        throw new Error();
                    }
                    const structCompareValue = comparator.structCompare(candidate, newNode);
                    if (structCompareValue < minStructCompareValue) {
                        minStructCompareValue = structCompareValue;
                        minStructCompareNode = candidate;
                    }
                }
                //ensure (partial) one-to-one matching
                if (!oldToNewMap.has(minStructCompareNode) || minStructCompareValue < oldToNewMap.get(minStructCompareNode).compareValue) {
                    oldToNewMap.set(minStructCompareNode, {
                        newNode: newNode,
                        compareValue: minStructCompareValue
                    })
                }
            }
        }

        for (const [oldNode, bestMatch] of oldToNewMap) {
            matching.matchNew(bestMatch.newNode, oldNode);
        }
    }

    _similarityMatching(oldNodes, newNodes, matching, comparator) {
        //filter leaves for unmatched nodes
        oldNodes = oldNodes.filter(n => !matching.hasAny(n)).sort((a, b) => comparator.sizeCompare(a,b));
        newNodes = newNodes.filter(n => !matching.hasAny(n)).sort((a, b) => comparator.sizeCompare(a,b));

        //Only matchings of nodes with the same label are allowed
        const oldLabelMap = new Map();
        for (const oldNode of oldNodes) {
            if (!oldLabelMap.has(oldNode.label)) {
                oldLabelMap.set(oldNode.label, []);
            }
            oldLabelMap.get(oldNode.label).push(oldNode);
        }

        //use a temporary map until the best matches are found
        const oldToNewMap = new Map();
        for (const newNode of newNodes) {
            if (oldLabelMap.has(newNode.label)) {
                //the minimum compare value
                let minCompareValue = 1;
                let minCompareNode = null;
                for (const oldNode of oldLabelMap.get(newNode.label)) {
                    let compareValue;
                    if (newNode.isLeaf()) {
                        //compare leaf nodes
                        compareValue = comparator.compare(newNode, oldNode);

                    } else {
                        //compare inner nodes
                        compareValue = (comparator.compare(newNode, oldNode) + comparator.matchCompare(newNode, oldNode)) / 2;
                    }
                    if (compareValue < minCompareValue) {
                        minCompareValue = compareValue;
                        minCompareNode = oldNode;
                    }

                }
                if (newNode.isLeaf() && minCompareValue < Config.LEAF_SIMILARITY_THRESHOLD || newNode.isInnerNode() && minCompareValue < Config.INNER_NODE_SIMILARITY_THRESHOLD) {
                    //ensure (partial) one-to-one matching
                    if (!oldToNewMap.has(minCompareNode) || minCompareValue < oldToNewMap.get(minCompareNode).compareValue) {
                        oldToNewMap.set(minCompareNode, {
                            newNode: newNode,
                            compareValue: minCompareValue
                        })
                    }
                }
            }
        }

        //the best matchings can be persisted
        for (const [oldNode, bestMatch] of oldToNewMap) {
            matching.matchNew(bestMatch.newNode, oldNode);
        }
    }

    _matchSimilarUnmatched(matching, comparator) {
        for (const [newNode, oldNode] of matching) {
            //TODO use method similar to 3DM, pathmatching for now

            //copy paths, reverse them and remove first element, discard already matched nodes
            const newPath = newNode.path.slice().reverse().slice(1);
            const oldPath = oldNode.path.slice().reverse().slice(1);

            const newToOldMap = new Map();

            //index in newPath where last matching occurred
            let j = 0;
            for (let i = 0; i < oldPath.length; i++) {
                for (let k = j; k < newPath.length; k++) {
                    //relax similarity threshold
                    if (matching.hasNew(newPath[k]) && oldPath.includes(matching.getNew(newNode))) {
                        //a matching within the path has been found, discard
                        return;
                    }
                    const compareValue = comparator.compare(newPath[k], oldPath[i]);
                    if (compareValue < Config.INNER_NODE_SIMILARITY_THRESHOLD) {
                        if(!newToOldMap.has(newPath[k]) || compareValue < newToOldMap.get(newPath[k]).compareValue) {
                            newToOldMap.set(newPath[k], {
                                oldNode: oldPath[i],
                                compareValue: compareValue
                            });
                        }
                        //update last matching index to avoid a false positive of the first if branch in subsequent iterations
                        j = k + 1;
                        break;
                    }
                }
            }

            //ensure (partial) one-to-one matching
            const oldToNewMap = new Map();
            for(const [newNode, bestMatch] of newToOldMap) {
                if (!oldToNewMap.has(bestMatch.oldNode) || bestMatch.compareValue < oldToNewMap.get(bestMatch.oldNode).compareValue) {
                    oldToNewMap.set(bestMatch.oldNode, {
                        newNode: newNode,
                        compareValue: bestMatch.compareValue
                    })
                }
            }

            //the best matchings can be persisted
            for (const [oldNode, bestMatch] of oldToNewMap) {
                matching.matchNew(bestMatch.newNode, oldNode);
            }
        }
    }
}

exports.ChawatheMatching = ChawatheMatching;