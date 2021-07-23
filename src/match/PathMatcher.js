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

export class PathMatcher extends AbstractMatchingAlgorithm {

    match(oldTree, newTree, matching, comparator) {
        //use a temporary map until the best matches are found
        const oldToNewMap = new Map();
        const newToOldMap = new Map();

        for (const [newNode, oldNode] of matching.newToOldMap) {
            //copy paths, reverse them and remove first element, discard already matched nodes
            const newPath = newNode.path.slice().reverse().slice(1);
            const oldPath = oldNode.path.slice().reverse().slice(1);

            //index in newPath where last matching occurred
            for (let i = 0; i < oldPath.length; i++) {
                for (let k = 0; k < newPath.length; k++) {
                    if (matching.hasOld(oldPath[i]) || matching.hasNew(newPath[k])) {
                        continue;
                    }
                    const compareValue = comparator.compare(newPath[k], oldPath[i]);
                    if (compareValue < Config.INNER_NODE_SIMILARITY_THRESHOLD
                        //never overwrite a better matching
                        && (!oldToNewMap.has(oldPath[i]) || compareValue < oldToNewMap.get(oldPath[i]).compareValue)
                        && (!newToOldMap.has(newPath[k]) || compareValue < newToOldMap.get(newPath[k]).compareValue)) {
                        if(oldToNewMap.has(oldPath[i])) {
                            newToOldMap.delete(oldToNewMap.get(oldPath[i]).node);
                        }
                        if(newToOldMap.has(newPath[k])) {
                            oldToNewMap.delete(newToOldMap.get(newPath[k]).node);
                        }
                        oldToNewMap.set(oldPath[i], {
                            compareValue: compareValue,
                            node: newPath[k]
                        });
                        newToOldMap.set(newPath[k], {
                            compareValue: compareValue,
                            node: oldPath[i]
                        });
                    }
                }
            }
        }

        //persist best matchings
        for (const [newNode, bestMatch] of newToOldMap) {
            matching.matchNew(newNode, bestMatch.node);
        }
    }
}