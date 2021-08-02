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
        /**
         * @type {Map<Node, Set<Node>>}
         */
        const possibleMap = new Map();

        //Match inner nodes that are along the path of already matched nodes.
        matchLoop: for (const [newNode, oldNode] of matching.newToOldMap) {

            //copy paths, reverse them and remove first element, discard already matched nodes
            const newPath = newNode.path.slice().reverse().slice(1).filter(n => !matching.hasNew(n));
            let oldPath = oldNode.path.slice().reverse().slice(1).filter(n => !matching.hasOld(n));

            for (const newNode of newPath) {
                for (const oldNode of oldPath) {

                    if (possibleMap.has(newNode) && possibleMap.get(newNode).has(oldNode)) {
                        //cut everything from oldNode upwards from oldPath
                        const oldNodeIndex = oldPath.indexOf(oldNode);
                        oldPath = oldPath.slice(0, oldNodeIndex)
                        continue matchLoop;
                    }


                    if (newNode.label === oldNode.label) {
                        if (!possibleMap.has(newNode)) {
                            possibleMap.set(newNode, new Set());
                        }
                        //Set remembers insertion order
                        possibleMap.get(newNode).add(oldNode);
                    }
                }
            }
        }

        //use a temporary map until the best matches are found
        const oldToNewMap = new Map();
        for (const [newNode, oldNodeSet] of possibleMap) {
            //the minimum compare value
            let minCompareValue = 1;
            let minCompareNode = null;
            for (const oldNode of oldNodeSet) {
                const compareValue = comparator.compare(newNode, oldNode);
                if (compareValue < minCompareValue) {
                    minCompareValue = compareValue;
                    minCompareNode = oldNode;
                }
            }
            if (minCompareValue < Config.INNER_NODE_SIMILARITY_THRESHOLD) {
                //ensure (partial) one-to-one matching
                if (!oldToNewMap.has(minCompareNode) || minCompareValue < oldToNewMap.get(minCompareNode).compareValue) {
                    oldToNewMap.set(minCompareNode, {
                        newNode: newNode,
                        compareValue: minCompareValue
                    })
                }
            }
        }

        //the best matches can be persisted
        for (const [oldNode, bestMatch] of oldToNewMap) {
            matching.matchNew(bestMatch.newNode, oldNode);
        }
    }
}