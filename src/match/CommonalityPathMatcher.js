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

import {Config} from "../Config.js";
import {AbstractMatchingAlgorithm} from "./AbstractMatchingAlgorithm.js";

export class CommonalityPathMatcher extends AbstractMatchingAlgorithm {

    match(oldTree, newTree, matching, comparator) {
        //use a temporary map until the best matches are found
        const oldToNewMap = new Map();
        const newToOldMap = new Map();

        const compared = new Map();
        for (const [newNode, oldNode] of matching.newToOldMap) {
            //copy paths, reverse them and remove first element, discard already matched nodes
            const newPath = newNode.path().slice().reverse().slice(1).filter(n => !matching.hasNew(n));
            const oldPath = oldNode.path().slice().reverse().slice(1).filter(n => !matching.hasOld(n));

            /*
            Only nodes with the same label can be matched.
            The usage of a hash map speeds up the matching if different labels are present (to be expected)
             */
            const labelMap = new Map();
            for (const oldNode of oldPath) {
                if (!labelMap.has(oldNode.label)) {
                    labelMap.set(oldNode.label, []);
                }
                labelMap.get(oldNode.label).push(oldNode);
            }

            for (const newNode of newPath) {
                if (!compared.has(newNode)) {
                    compared.set(newNode, new Set());
                }
                if (labelMap.has(newNode.label)) {
                    for (const oldNode of labelMap.get(newNode.label)) {
                        if (compared.get(newNode).has(oldNode)) {
                            continue;
                        } else {
                            compared.get(newNode).add(oldNode);
                        }

                        const compareValue = (comparator.compare(newNode, oldNode) + this.commonality(newNode, oldNode, matching)) / 2;

                        if (compareValue < Config.COMPARISON_THRESHOLD
                            //never overwrite a better matching
                            && (!oldToNewMap.has(oldNode) || compareValue < oldToNewMap.get(oldNode).compareValue)
                            && (!newToOldMap.has(newNode) || compareValue < newToOldMap.get(newNode).compareValue)) {
                            if (oldToNewMap.has(oldNode)) {
                                newToOldMap.delete(oldToNewMap.get(oldNode).node);
                            }
                            if (newToOldMap.has(newNode)) {
                                oldToNewMap.delete(newToOldMap.get(newNode).node);
                            }
                            oldToNewMap.set(oldNode, {
                                compareValue: compareValue,
                                node: newNode
                            });
                            newToOldMap.set(newNode, {
                                compareValue: compareValue,
                                node: oldNode
                            });
                        }
                    }
                }
            }
        }

        //persist best matches
        for (const [newNode, bestMatch] of newToOldMap) {
            matching.matchNew(newNode, bestMatch.node);
        }
    }

    commonality(newNode, oldNode, matching) {
        let common = 0;
        const newSet = new Set(newNode.leaves());
        const oldSet = new Set(oldNode.leaves());

        for (const newCand of newSet) {
            if (matching.hasNew(newCand) && oldSet.has(matching.getNew(newCand))) {
                common++;
            }
        }

        return 1 - (common / (Math.max(newSet.size, oldSet.size)));
    }
}