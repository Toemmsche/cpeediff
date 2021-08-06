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

export class UnmatchedMatcher extends AbstractMatchingAlgorithm {

    match(oldTree, newTree, matching, comparator) {
        /*
        Match unmatched nodes whose parents, left siblings, and right siblings are matched and whose labels are equal.
        If one node does not have a left/right sibling, the other one cannot have one either.

        Only non-property nodes (excluding the root) are considered.
         */
        for (const newNode of newTree.nonPropertyNodes().filter(n => !matching.hasNew(n))) {

            const leftSibling = newNode.getLeftSibling();
            const rightSibling = newNode.getRightSibling();
            const parent = newNode.parent;

            //Left or right sibling must either not exist, or be matched
            if (!this._nullOrTrue(leftSibling, (n) => matching.hasNew(n))
                || !this._nullOrTrue(rightSibling, (n) => matching.hasNew(n))
                || !this._nullOrTrue(parent, (n) => matching.hasNew(n))) {
                continue;
            }

            const rightSiblingMatch = matching.getNew(rightSibling);
            const leftSiblingMatch = matching.getNew(leftSibling);
            const parentMatch = matching.getNew(parent);

            //If they are matched, their parent must be matched to the parent of the node
            if (!this._nullOrTrue(leftSiblingMatch, (n) => n.parent === parentMatch)
                || !this._nullOrTrue(rightSiblingMatch, (n) => n.parent === parentMatch)) {
                continue;
            }

            let potentialMatch;

            //Case 1: Node has both a right and a left sibling
            if (leftSibling != null && rightSibling != null) {
                if (rightSiblingMatch.getLeftSibling() == null || rightSiblingMatch.getLeftSibling() !== leftSiblingMatch.getRightSibling()) {
                    continue;
                }
                potentialMatch = rightSiblingMatch.getLeftSibling();

                //Case 2: Node has a left, but no right sibling
            } else if (rightSibling == null && leftSibling != null) {
                if (leftSiblingMatch.getRightSibling() == null) {
                    continue;
                }
                potentialMatch = leftSiblingMatch.getRightSibling();
                //potential match cannot have a right sibling
                if(potentialMatch.getRightSibling() != null) {
                    continue;
                }

                //Case 3: Node has a right, but no left sibling
            } else if (rightSibling != null && leftSibling == null) {
                if (rightSiblingMatch.getLeftSibling() == null) {
                    continue;
                }
                potentialMatch = rightSiblingMatch.getLeftSibling();
                //potential match cannot have a left sibling
                if(potentialMatch.getLeftSibling() != null) {
                    continue;
                }
                //Case 4: Node has neither a left nor a right sibling
            } else {
                potentialMatch = parentMatch.getChild(0);
            }

            if(potentialMatch == null) {
                console.log("sdf29");
            }
            //Potential match must be unmatched and have the same label
            if (potentialMatch.label === newNode.label && !matching.hasOld(potentialMatch)) {
                matching.matchNew(newNode, potentialMatch);
            }
        }
    }

    /**
     * @param {Node} node The input node
     * @param {Function} boolFunc A boolean function taking a single node as an argument.
     * @return boolean True if the input node is null (soft equality) or the boolean function evaluates to true.
     * @private
     */
    _nullOrTrue(node, boolFunc) {
        if (node == null) return true;
        return boolFunc(node);
    }

}