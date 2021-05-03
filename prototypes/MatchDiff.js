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

const {AbstractDiff} = require("./AbstractDiff");
const {CPEEModel} = require("./CPEE/CPEEModel");

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

        const oldInnerNodes = this.model1.innerNodes();
        const newInnerNodes = this.model2.innerNodes();


        //compute approximate matching based on Kyong-Ho et al https://www.researchgate.net/publication/3297320_An_efficient_algorithm_to_compute_differences_between_structured_documents
        const matchOldToNew = new Map();
        let newToOldMatching= new Map();
        getMatching();

        function getMatching() {
            /*
            Step 1: Match leaf nodes.
             */

            //The treshold t dictates how similar two leaf nodes have to be in order to be matched (Matching Criterion 1)
            const t = 0.1;
            for (const newLeafNode of newLeafNodes) {
                //the minimum compare value
                let minCompareValue = 2;
                for (const oldLeafNode of oldLeafNodes) {
                    const compareValue = newLeafNode.compareTo(oldLeafNode);
                    if (compareValue < t) {
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
            for(const [newLeafNode, matchArray] of newToOldMatching) {
                if(matchArray.length > 1) {
                    //turn into one-to-one matching according to matching criterion 2
                    //TODO
                    matchArray.splice(1,matchArray.length - 1);
                }
            }

            /*
            Step 3: Match inner nodes.
             */
            //Every pair of matched leaf nodes induces a comparison of the respective node paths from root to parent
            //to find potential matches. As non-leaf nodes in the CPEE standard do not hold complex attribute data,
            //we can resort to simpler comparison methods.
            for(const [newLeafNode, oldMatchArray] of newToOldMatching) {
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
                        if(newToOldMatching.has(newPath[k]) && oldPath.includes(newToOldMatching.get(newPath[k]))) {
                            //If so, we terminate to preserve ancestor order
                            return;
                            //TODO replace with nodecompare or nodeeuqals
                        } else if(newPath[k].label === oldPath[i].label) {
                            //found new matching
                            if(!newToOldMatching.has(newPath[k])) {
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
            for(const [newInnerNode, oldMatchArray] of newToOldMatching) {
                if(oldMatchArray.size > 1) {
                    //choose the old node with the highest similarity value
                    let maxSimilarityValue = 0;
                    let maxSimilarityNode = null;
                    for(const oldInnerNode of oldMatchArray) {
                        const similarityValue = matchingSimilarity(oldInnerNode, newInnerNode);
                        if(similarityValue> maxSimilarityValue) {
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

                if(oldSubTreePreOrder.length === 0 || newSubTreePreOrder.length === 0) {
                    return 0;
                }

                let commonSize = 0;
                for(const oldNode of oldSubTreePreOrder) {
                    for(const newNode of newSubTreePreOrder) {
                        //TODO replace with compare
                        if(newToOldMatching.has(newNode) && newToOldMatching.get(newNode) === oldNode) {
                            commonSize++;
                        }
                    }
                }

                return commonSize / oldSubTreePreOrder.length;
            }
        }



        //based on https://db.in.tum.de/~finis/papers/RWS-Diff.pdf
        function generateEditScript() {
            for (const node2 of preOrder2) {
                if (node2.parent === null) continue;
                if (matchBtoA.has(node2)) {
                    const match = matchBtoA.get(node2);
                    if (match.parent.tag !== node2.parent.tag) {
                        console.log("MOVE " + match.tag + " TO " + matchBtoA.get(node2.parent).tag);
                    }
                    if (match.tag !== node2.tag) {
                        console.log("RENAME " + match.tag + " to " + node2.tag);
                        match.tag = node2.tag;
                    }
                } else {
                    console.log("INSERT " + node2.tag + " AT " + node2.parent.tag);
                    newToOldMatching.set(node2, node2);
                    matchBtoA.set(node2, node2);
                }
            }

            for (const node1 of postOrder1) {
                if (!newToOldMatching.has(node1)) {
                    console.log("REMOVE " + node1.tag);
                }
            }
        }

        generateEditScript();

        console.log("lol");
    }
}

exports.MatchDiff = MatchDiff;