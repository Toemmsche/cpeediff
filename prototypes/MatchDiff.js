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

    TOP_DOWN;

    constructor(model1, model2, options = ["--with-top-down"]) {
        super(model1, model2, options, ["--with-top-down"]);
        this.TOP_DOWN = this.options.includes("--with-top-down");
    }

    diff() {
        //get all nodes, leaf nodes and inner nodes of the models
        const oldPostOrderArray = this.model1.toPostOrderArray();
        const newPreOrderArray = this.model2.toPreOrderArray();
        const oldLeafNodes = this.model1.leafNodes();
        const newLeafNodes = this.model2.leafNodes();

        //compute approximate matching based on https://www.researchgate.net/publication/3297320_An_efficient_algorithm_to_compute_differences_between_structured_documents
        const oldToNewMatching = new Map();
        const newToOldMatching = new Map();

        if (this.TOP_DOWN) {
            getTopDownMatching(this.model1.root, this.model2.root);
        }
        getMatching();

        //TODO top down matching (as option)
        function getTopDownMatching(oldNode, newNode) {
            if (oldNode.nodeEquals(newNode)) {
                newToOldMatching.set(newNode, [oldNode]);
                for (const oldChild of oldNode.childNodes) {
                    for (const newChild of newNode.childNodes) {
                        getTopDownMatching(oldChild, newChild);
                    }
                }
            }
        }

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
                    if (compareValue < minCompareValue && compareValue <= t) {
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
                const newPath = newLeafNode.path.slice().reverse().slice(1);
                const oldPath = oldLeafNode.path.slice().reverse().slice(1);

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

        //TODO insert optional PHASE 4 algo step from https://www.researchgate.net/publication/3943331_Detecting_changes_in_XML_documents

        //TODO order
        //All nodes have the right path and are right.
        //However, order of child nodes might not be right, we must verify that it matches the new model.


        //append changes to patch file
        const patch = new MatchPatch();
        generateEditScript();

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
                    let copied = false;

                    /*
                    if (oldToNewMatching.get(match).length > 1) {
                        for (const copy of oldToNewMatching.get(match)) {
                            //prevent duplicate copy operations
                            if (newPreOrderArray.indexOf(copy) < newPreOrderArray.indexOf(newNode)) {
                                patch.changes.push(new Change(Change.typeEnum.COPY, copy, matchOfParent, newNode.childIndex))
                                const copyOfMatch = match.copy();
                                matchOfParent.insertChild(copyOfMatch, newNode.childIndex);
                                //create mapping for newly inserted copy
                                newToOldMatching.set(newNode, [copyOfMatch]);
                                copied =  true;
                            }
                        }
                    }

                     */

                    if (!copied && !matchOfParent.nodeEquals(match.parent)) {
                        //move match to matchOfParent
                        patch.changes.push(new Change(Change.typeEnum.MOVE, match, matchOfParent, newNode.childIndex));
                        match.removeFromParent();
                        matchOfParent.insertChild(match, newNode.childIndex);
                    }

                    if (!newNode.nodeEquals(match)) {
                        //relabel node
                        patch.changes.push(new Change(Change.typeEnum.RELABEL, match, newNode, match.childIndex));
                        match.label = newNode.label;
                    }
                } else {
                    //perform insert operation at match of the parent node
                    const copy = newNode.copy();
                    matchOfParent.insertChild(copy, newNode.childIndex);
                    //insertions are always mapped back to the original node
                    newToOldMatching.set(newNode, [copy]);
                    patch.changes.push(new Change(Change.typeEnum.INSERTION, copy, matchOfParent, newNode.childIndex));
                }
            }
            for (const oldNode of oldPostOrderArray) {
                if (!oldToNewMatching.has(oldNode)) {
                    //delete node
                    patch.changes.push(new Change(Change.typeEnum.DELETION, oldNode, oldNode.parent, oldNode.childIndex));
                    oldNode.removeFromParent();
                }
            }
        }

        patch.compress();
        return patch;
    }
}

exports.MatchDiff = MatchDiff;