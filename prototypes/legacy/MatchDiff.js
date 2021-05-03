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

    constructor(model1, model2, options= []) {
        super(model1, model2, options);
    }


    diff() {
        //TODO set diff

        const preOrder1 = this.model1.toPreOrderArray();
        const preOrder2 = this.model2.toPreOrderArray();
        const postOrder1 = this.model1.toPostOrderArray();

        const leafNodes1 = preOrder1.filter(n => n.childNodes.length === 0);
        const leafNodes2 = preOrder2.filter(n => n.childNodes.length === 0);

        const innerNodes1 = preOrder1.filter(n => n.childNodes.length > 0);
        const innerNodes2 = preOrder2.filter(n => n.childNodes.length > 0);

        //compute approximate matching based on Kyong-Ho et al https://www.researchgate.net/publication/3297320_An_efficient_algorithm_to_compute_differences_between_structured_documents
        const matchAtoB = new Map();
        const matchBtoA = new Map();


        //Matching criterion 1
        for(const leaf2 of leafNodes2) {
            for (const leaf1 of leafNodes1) {
                if(leaf2.tag === leaf1.tag) {
                    matchBtoA.set(leaf2, leaf1);
                    matchAtoB.set(leaf1, leaf2);
                }
            }
        }

        //Matching criterion 2
        for(const [node, match] of matchAtoB) {
            pathMatch(node, match);
        }


        function pathMatch(nodeA, nodeB) {
            let j = 0;
            const pathA = nodeA.path.slice(0, nodeA.path.length - 1).reverse();
            const pathB = nodeB.path.slice(0, nodeB.path.length - 1).reverse();
            for (let i = 0; i < pathA.length; i++) {
                for (let k = j; k < pathB.length; k++) {
                    if(matchBtoA.has(pathB[k]) && pathA.includes(matchBtoA.get(pathB[k]))) {
                        //terminate
                        return;
                    }
                    if(pathB[k].tag === pathA[i].tag) {
                        matchBtoA.set(pathB[k], pathA[i]);
                        matchAtoB.set(pathA[i], pathB[k]);
                        j = k + 1;
                        break;
                    }
                }
            }
        }

        //based on https://db.in.tum.de/~finis/papers/RWS-Diff.pdf
        function generateEditScript() {
            for(const node2 of preOrder2) {
                if(node2.parent === null) continue;
                if(matchBtoA.has(node2)) {
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
                    matchAtoB.set(node2, node2);
                    matchBtoA.set(node2, node2);
                }
            }

            for(const node1 of postOrder1) {
                if(!matchAtoB.has(node1)) {
                    console.log("REMOVE " + node1.tag);
                }
            }
        }

        generateEditScript();

        console.log("lol");
    }
}

exports.MatchDiff = MatchDiff;