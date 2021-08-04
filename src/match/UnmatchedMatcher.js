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

export class UnmatchedMatcher extends AbstractMatchingAlgorithm {

    match(oldTree, newTree, matching, comparator) {
        //TODO speed this up if large parts are matched
        for (const [newNode, oldNode] of matching.newToOldMap) {
            //TODO use method similar to 3DM, pathmatching for now

            //copy paths, reverse them and remove first element, discard already matched nodes
            const newPath = newNode.path.slice().reverse().slice(1).filter(n => !matching.hasNew(n));
            const oldPath = oldNode.path.slice().reverse().slice(1).filter(n => !matching.hasOld(n));

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
                    if (compareValue < Config.COMPARISON_THRESHOLD) {
                        if (!newToOldMap.has(newPath[k]) || compareValue < newToOldMap.get(newPath[k]).compareValue) {
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
            for (const [newNode, bestMatch] of newToOldMap) {
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