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

export class SimilarityMatcher extends AbstractMatchingAlgorithm {

    match(oldTree, newTree, matching, comparator) {
        //filter for unmatched nodes and sort ascending by size
        const oldNodes = oldTree.leaves().filter(n => !matching.hasAny(n));
        const newNodes = newTree.leaves().filter(n => !matching.hasAny(n));

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
        newNodeLoop: for (const newNode of newNodes) {
            if (oldLabelMap.has(newNode.label)) {
                //the minimum compare value
                let minCompareValue = 1;
                let minCompareNode = null;
                //skip perfect matches
                for (const oldNode of oldLabelMap.get(newNode.label).filter(n => !matching.hasOld(n))) {
                    const compareValue = comparator.compare(newNode, oldNode);

                    //Perfect match? => add to M and resume with different node
                    if(compareValue === 0) {
                        matching.matchNew(newNode, oldNode);
                        oldToNewMap.delete(oldNode);
                        continue newNodeLoop;
                    }

                    if (compareValue < minCompareValue) {
                        minCompareValue = compareValue;
                        minCompareNode = oldNode;
                    }
                }
                if (minCompareValue < Config.COMPARISON_THRESHOLD) {
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

        //the best matches can be persisted
        for (const [oldNode, bestMatch] of oldToNewMap) {
            matching.matchNew(bestMatch.newNode, oldNode);
        }
    }
}