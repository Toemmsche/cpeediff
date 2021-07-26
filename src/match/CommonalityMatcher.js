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
import {Config} from "../Config.js";

export class CommonalityMatcher extends AbstractMatchingAlgorithm {

    match(oldTree, newTree, matching, comparator) {

        /**
         * Maps each node to a map of commonality counters
         * @type Map<Node,<Map<Node,Number>>
         */
        const comMap = new Map();

        const oldInners = oldTree
            .innerNodes()
            .filter(n => !matching.hasOld(n))
            .sort((a, b) => comparator.compareSize(a, b));
        const newInners = newTree
            .innerNodes()
            .filter(n => !matching.hasNew(n))
            .sort((a, b) => comparator.compareSize(a, b));

        for (const newInner of newInners) {
            const commonalityCountMap = new Map()
            for (const oldInner of oldInners) {
                commonalityCountMap.set(oldInner, 0);
            }
            comMap.set(newInner, commonalityCountMap);
        }

        //push up commonality from matched leaves
        const matchedNewLeaves = newTree.leaves().filter(n => matching.hasNew(n));
        for (const matchedNewLeaf of matchedNewLeaves) {
            const oldLeaf = matching.getNew(matchedNewLeaf);
            //increase commonality for all unmatched nodes along the paths
            const newPath = matchedNewLeaf.path.filter(n => !matching.hasNew(n));
            const oldPath = oldLeaf.path.filter(n => !matching.hasOld(n));

            for (const newNode of newPath) {
                const comVals = comMap.get(newNode);
                for (const oldNode of oldPath) {
                    const newCommonalityVal = comVals.get(oldNode) + 1;
                    comVals.set(oldNode, newCommonalityVal);
                }
            }
        }

        //TODO bUILD LABEL MAP WITH ASCENDING SIZE
        for (const newInner of newInners) {
            const comVals = comMap.get(newInner);
            //Size should not include property nodes
            const size = comparator.fastElementSize(newInner);
            /*
            Because subtrees are visited in ascending order, we must find a potential match first,
            then propagate all commonality values to the parent node.
             */
            let minCV = 1;
            let bestMatch = null;
            for (const oldInner of oldInners.filter(n => !matching.hasOld(n) && n.label === newInner.label)) {
                //do not count the subtree root
                const maxSize = Math.max(comparator.fastElementSize(oldInner) - 1, size - 1);
                //TODO apply weights
                const CV = ((1 - (comVals.get(oldInner) / maxSize)) * 2 + comparator.compare(oldInner, newInner)) / 3;
                if (CV < minCV) {
                    minCV = CV;
                    bestMatch = oldInner;
                }
            }

            if (minCV <= Config.INNER_NODE_SIMILARITY_THRESHOLD) {
                //create new match
                matching.matchNew(newInner, bestMatch);

                //increase commonality for all unmatched nodes along the paths
                const newPath = newInner.path.filter(n => !matching.hasNew(n));
                const oldPath = bestMatch.path.filter(n => !matching.hasOld(n));

                for (const newNode of newPath) {
                    const comVals = comMap.get(newNode);
                    for (const oldNode of oldPath) {
                        const newCommonalityVal = comVals.get(oldNode) + 1;
                        comVals.set(oldNode, newCommonalityVal);
                    }
                }
            }
        }
    }
}