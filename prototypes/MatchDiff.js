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

const {CPEENode} = require("./CPEE/CPEENode");
const {AbstractDiff} = require("./AbstractDiff");
const {CPEEModel} = require("./CPEE/CPEEModel");
const {MatchPatch, Change} = require("./MatchPatch");

class MatchDiff extends AbstractDiff {

    constructor(model1, model2, options = []) {
        super(model1, model2, options);
    }


    diff() {
        //get all nodes, leaf nodes and inner nodes of the models
        const oldPostOrderArray = this.model1.toPostOrderArray();
        const newPreOrderArray = this.model2.toPreOrderArray();
        const oldLeafNodes = this.model1.leafNodes();
        const newLeafNodes = this.model2.leafNodes();

        //compute approximate matching based on https://www.researchgate.net/publication/3297320_An_efficient_algorithm_to_compute_differences_between_structured_documents
        const oldToNewMatching = new Map();
        let newToOldMatching = new Map();
        getMatching();

        function getMatching() {
            /*
            Step 1: Match leaf nodes.
             */

            //The treshold t dictates how similar two leaf nodes have to be in order to be matched (Matching Criterion 1)
            const t = 0.5;
            for (const newLeafNode of newLeafNodes) {
                //the minimum compare value
                let minCompareValue = 2;
                for (const oldLeafNode of oldLeafNodes) {
                    const compareValue = newLeafNode.compareTo(oldLeafNode);
                    if (compareValue < minCompareValue) {
                        minCompareValue = compareValue;
                        //Discard all matchings with a higher comparison value
                        newToOldMatching.set(newLeafNode, []);
                    }
                    if (compareValue <= t) {
                        //Matching is as as good as previous best, save for now
                        newToOldMatching.get(newLeafNode).push(oldLeafNode);
                    }
                }
            }

            /*
            Step 2: Transform one-to-many (new to old) leaf node matchings  into one-to-one matchings
             */
            for (const [newLeafNode, matchArray] of newToOldMatching) {
                if (matchArray.length > 1) {
                    //turn into one-to-one matching according to matching criterion 2
                    //TODO
                    matchArray.splice(1, matchArray.length - 1);
                }
            }

            /*
            Step 3: Match inner nodes.
             */
            //Every pair of matched leaf nodes induces a comparison of the respective node paths from root to parent
            //to find potential matches. As non-leaf nodes in the CPEE standard do not hold complex attribute data,
            //we can resort to simpler comparison methods.
            for (const [newLeafNode, oldMatchArray] of newToOldMatching) {
                matchPath(oldMatchArray[0], newLeafNode);
            }

            function matchPath(oldLeafNode, newLeafNode) {
                const newPath = newLeafNode.path.reverse().slice(1);
                const oldPath = oldLeafNode.path.reverse().slice(1);

                //index in newPath where last matching occurred
                let j = 0;
                for (let i = 0; i < oldPath.length; i++) {
                    for (let k = 0; k < newPath.length; k++) {
                        //does there already exist a match between the two paths?
                        if (newToOldMatching.has(newPath[k]) && oldPath.includes(newToOldMatching.get(newPath[k])[0])) {
                            //If so, we terminate to preserve ancestor order
                            return;
                            //TODO replace with nodecompare or nodeeuqals
                        } else if (newPath[k].label === oldPath[i].label) {
                            //found new matching
                            if (!newToOldMatching.has(newPath[k])) {
                                newToOldMatching.set(newPath[k], []);
                            }
                            newToOldMatching.get(newPath[k]).push(oldPath[i]);
                            //update last matching index to avoid a false positive of the first if branch in subsequent iterations
                            j = k + 1;
                        }
                    }
                }
            }

            /*
            Step 4: Transform one-to-many (new to old) inner node matchings into one-to-one matchings.
             */
            for (const [newInnerNode, oldMatchArray] of newToOldMatching) {
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
                const oldSubTreePreOrder = new CPEEModel(oldRootNode).toPreOrderArray().slice(1);
                const newSubTreePreOrder = new CPEEModel(newRootNode).toPreOrderArray().slice(1);

                if (oldSubTreePreOrder.length === 0 || newSubTreePreOrder.length === 0) {
                    return 0;
                }

                let commonSize = 0;
                for (const newNode of newSubTreePreOrder) {
                    if (newToOldMatching.has(newNode)) {
                        //TODO replace with compare
                        if (oldSubTreePreOrder.includes(newToOldMatching.get(newNode))) {
                            commonSize++;
                        }
                    }
                }

                return commonSize / oldSubTreePreOrder.length;
            }
        }

        for (const [newNode, matchArray] of newToOldMatching) {
            const oldNode = matchArray[0];
            if (!oldToNewMatching.has(oldNode)) {
                oldToNewMatching.set(oldNode, []);
            }
            oldToNewMatching.get(oldNode).push(newNode);
        }

        //append changes to patch file
        const patch = new MatchPatch();

        //Edit script generation based on https://db.in.tum.de/~finis/papers/RWS-Diff.pdf
        function generateEditScript() {
            //iterate in pre order through new model
            for (const newNode of newPreOrderArray) {
                //We can safely skip the root node, as it will always be mapped between two CPEE models
                if (newNode.parent == null) continue;
                const matchOfParent = newToOldMatching.get(newNode.parent)[0];
                if (newToOldMatching.has(newNode)) {
                    //new Node has a match in the old model
                    const match = newToOldMatching.get(newNode)[0];
                    //TODO copy
                    if (!matchOfParent.nodeEquals(match.parent)) {
                        //move match to matchOfParent
                        patch.changes.push(new Change(Change.typeEnum.MOVE, match, matchOfParent));
                        match.removeFromParent();
                        matchOfParent.insertChild(match);
                    }
                    if (!newNode.nodeEquals(match)) {
                        //relabel node
                        patch.changes.push(new Change(Change.typeEnum.RELABEL, match, newNode));
                        match.label = newNode.label;
                    }
                } else {
                    //perform insert operation at match of the parent node
                    const copy = newNode.copy();
                    matchOfParent.insertChild(copy);
                    //insertions are always mapped back to the original node
                    newToOldMatching.set(newNode, [copy]);
                    patch.changes.push(new Change(Change.typeEnum.INSERTION, copy, matchOfParent));
                }
            }
            for (const oldNode of oldPostOrderArray) {
                if (!oldToNewMatching.has(oldNode)) {
                    //delete node
                    patch.changes.push(new Change(Change.typeEnum.DELETION, oldNode, oldNode.parent));
                    oldNode.removeFromParent();
                }
            }
        }

        generateEditScript();

        return patch;
    }
}

exports.MatchDiff = MatchDiff;