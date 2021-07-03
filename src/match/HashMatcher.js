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

import {AbstractMatchingAlgorithm} from "./AbstractMatchingAlgorithm.js";
import {HashExtractor} from "./extract/HashExtractor.js";

export class HashMatcher extends AbstractMatchingAlgorithm {

    match(oldTree, newTree, matching, comparator) {
        //filter for unmatched nodes and sort new Nodes descending by size
        const oldNodes = oldTree.nonPropertyNodes().filter(n => !matching.hasAny(n));
        const newNodes = newTree.nonPropertyNodes().filter(n => !matching.hasAny(n)).sort((a, b) => comparator.sizeCompare(b, a));

        const hashExtractor = new HashExtractor();

        //build hash map node hashes
        //build with new Nodes first to allow ascending size traversal later on
        const hashMap = new Map();
        for (const newNode of newNodes) {
            const hash = hashExtractor.get(newNode);
            if (!hashMap.has(hash)) {
                hashMap.set(hash, {
                    oldNodes: [],
                    newNodes: []
                });
            }
            hashMap.get(hash).newNodes.push(newNode);
        }
        for (const oldNode of oldNodes) {
            const hash = hashExtractor.get(oldNode);
            //if the node's hash wil never find a partner, we don't bother adding it
            if (hashMap.has(hash)) {
                hashMap.get(hash).oldNodes.push(oldNode);
            }
        }

        //map remembers insertion order (see https://developer.mozilla.org/de/docs/orphaned/Web/JavaScript/Reference/Global_Objects/Map)
        for (const [hash, nodes] of hashMap) {
            const oldToNewMap = new Map();

            newNodeLoop: for (const newNode of nodes.newNodes) {
                //existing matchings cannot be altered
                if (matching.hasNew(newNode)) {
                    continue;
                }
                let minStructCompareValue = 2;
                let minStructCompareNode = null;
                for (const oldNode of nodes.oldNodes) {
                    //existing matchings cannot be altered
                    if (matching.hasOld(oldNode)) {
                        continue;
                    }
                    //compare structurally only, content equality is guaranteed through hash equality
                    const structCompareValue = comparator.structCompare(oldNode, newNode);
                    if (structCompareValue === 0) {
                        //found a perfect match, remove both nodes from candidates list
                        const newPreOrder = newNode.toPreOrderArray();
                        const oldPreOrder = oldNode.toPreOrderArray();
                        if (newPreOrder.length !== oldPreOrder.length) {
                            throw new Error();
                        }
                        for (let i = 0; i < newPreOrder.length; i++) {
                            matching.matchNew(newPreOrder[i], oldPreOrder[i]);
                        }
                        oldToNewMap.delete(oldNode);
                        continue newNodeLoop;
                    } else if (structCompareValue < minStructCompareValue) {
                        minStructCompareValue = structCompareValue;
                        minStructCompareNode = oldNode;
                    }
                }
                if (minStructCompareNode != null && (!oldToNewMap.has(minStructCompareNode) || minStructCompareValue < oldToNewMap.get(minStructCompareNode).compareValue)) {
                    oldToNewMap.set(minStructCompareNode, {
                        newNode: newNode,
                        compareValue: minStructCompareValue
                    })
                }
            }
            for (const [oldNode, bestMatch] of oldToNewMap) {
                matching.matchNew(bestMatch.newNode, oldNode);
            }
        }
    }
}

