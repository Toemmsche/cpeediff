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
            .sort((a,b) => comparator.compareSize(a,b));
        const newInners = newTree
            .innerNodes()
            .filter(n => !matching.hasNew(n))
            .sort((a,b) => comparator.compareSize(a,b));

        for (const newInner of newInners) {
            const commonalityCountMap = new Map()
            for (const oldInner of oldInners) {
                commonalityCountMap.set(oldInner, 0);
            }
            comMap.set(newInner, commonalityCountMap);
        }

        for(const newInner of newInners) {
            //TODO
        }
    }
}