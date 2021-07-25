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

export class UnmatchedMatcher2 extends AbstractMatchingAlgorithm {

    match(oldTree, newTree, matching, comparator) {
        //FROM 3DM, optimize
        //traverse in post order
        for(const newNode of newTree.toPostOrderArray().filter(n => !n.isPropertyNode() && !matching.hasNew(n))) {
            const leftSibling = newNode.getLeftSibling();
            const rightSibling = newNode.getRightSibling();
            const parent = newNode.parent;
            const parentMatch = matching.getNew(parent);

            if(leftSibling != null && rightSibling != null) {
                if(!matching.hasNew(leftSibling) || !matching.hasNew(rightSibling) || !matching.hasNew(parent)) {
                    continue;
                }

                const rightSiblingMatch = matching.getNew(rightSibling);
                const leftSiblingMatch = matching.getNew(leftSibling);

                if(rightSiblingMatch.parent !== parentMatch || leftSiblingMatch.parent !== parentMatch) {
                    continue;
                }

                if(rightSiblingMatch.getLeftSibling() == null || rightSiblingMatch.getLeftSibling() !== leftSiblingMatch.getRightSibling()) {
                    continue;
                }

                const potentialMatch = rightSiblingMatch.getLeftSibling();
                if(potentialMatch.label === newNode.label && !matching.hasOld(potentialMatch)) {
                    matching.matchNew(newNode, potentialMatch);
                }
            } else if(rightSibling == null && leftSibling != null) {
                if(!matching.hasNew(leftSibling) || !matching.hasNew(parent)) {
                    continue;
                }

                const leftSiblingMatch = matching.getNew(leftSibling);
                if(leftSiblingMatch.parent !== parentMatch) {
                    continue;
                }

                if(leftSiblingMatch.getRightSibling() == null) {
                    continue;
                }

                const potentialMatch = leftSiblingMatch.getRightSibling();
                if(potentialMatch.label === newNode.label && !matching.hasOld(potentialMatch)) {
                    matching.matchNew(newNode, potentialMatch);
                }
            } else if(rightSibling != null && leftSibling == null) {
                if(!matching.hasNew(rightSibling) || !matching.hasNew(parent)) {
                    continue;
                }

                const rightSiblingMatch = matching.getNew(rightSibling);
                if(rightSiblingMatch.parent !== parentMatch) {
                    continue;
                }

                if(rightSiblingMatch.getLeftSibling() == null) {
                    continue;
                }

                const potentialMatch = rightSiblingMatch.getLeftSibling();
                if(potentialMatch.label === newNode.label && !matching.hasOld(potentialMatch)) {
                    matching.matchNew(newNode, potentialMatch);
                }
            }
        }
    }
}