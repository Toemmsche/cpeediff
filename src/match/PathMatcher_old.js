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

export class PathMatcher_old extends AbstractMatchingAlgorithm {

    match(oldTree, newTree, matching, comparator) {
        //use a temporary map until the best matches are found
        const oldToNewMap = new Map();
        const newToOldMap = new Map();

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
                if(!labelMap.has(oldNode.label)) {
                    labelMap.set(oldNode.label, []);
                }
                labelMap.get(oldNode.label).push(oldNode);
            }
            for(const newNode of newPath) {
                if(labelMap.has(newNode.label)) {
                    for(const oldNode of labelMap.get(newNode.label)) {

                        const compareValue = comparator.compare(newNode, oldNode);
                        if (compareValue < Config.COMPARISON_THRESHOLD
                            //never overwrite a better matching
                            && (!oldToNewMap.has(oldNode) || compareValue < oldToNewMap.get(oldNode).compareValue)
                            && (!newToOldMap.has(newNode) || compareValue < newToOldMap.get(newNode).compareValue)) {
                            if(oldToNewMap.has(oldNode)) {
                                newToOldMap.delete(oldToNewMap.get(oldNode).node);
                            }
                            if(newToOldMap.has(newNode)) {
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
}