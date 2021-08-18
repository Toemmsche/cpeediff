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

import {AbstractMatchingAlgorithm} from './AbstractMatchingAlgorithm.js';
import {Dsl} from '../Dsl.js';
import {Logger} from '../../util/Logger.js';

export class UnmatchedMatcher extends AbstractMatchingAlgorithm {

  match(oldTree, newTree, matching, comparator) {

    //Pre-order traversal to detect up-down sandwiched inner nodes
    for (const newNode of newTree.innerNodes().filter(n => !matching.hasNew(n))) {
      if (newNode.label === Dsl.ELEMENTS.OTHERWISE.label && matching.hasNew(newNode.parent)) {
        const parentMatch = matching.getNew(newNode.parent);
        const potentialMatches = parentMatch.children.filter(n => n.label === Dsl.ELEMENTS.OTHERWISE.label);
        if (potentialMatches.length > 1) {
          Logger.warn('Choose node with multiple \'otherwise\' branches', this);
        } else if (potentialMatches.length === 1 && !matching.hasOld(potentialMatches[0])) {
          matching.matchNew(newNode, potentialMatches[0]);
          continue;
        }
      }

      const parentMatch = matching.getNew(newNode.parent);
      let minCompareValue = 1;
      let minCompareNode = null;

      newNode.children.forEach(n => {
        if (matching.hasNew(n)) {
          const match = matching.getNew(n);
          if (match.parent.label === newNode.label && !matching.hasOld(match.parent) && match.parent.parent === parentMatch) {
            const CV = comparator.compare(newNode, match.parent);
            if (CV < minCompareValue) {
              minCompareNode = match.parent;
              minCompareValue = CV;
            }
          }
        }
      });

      //up-down sandwich has priority
      if (minCompareNode != null) {
        matching.matchNew(newNode, minCompareNode);
      } else {
        const leftSibling = newNode.getLeftSibling();
        const rightSibling = newNode.getRightSibling();

        //Left or right sibling must either not exist, or be matched
        if (!this._nullOrTrue(leftSibling, (n) => matching.hasNew(n))
            || !this._nullOrTrue(rightSibling, (n) => matching.hasNew(n))) {
          continue;
        }

        const rightSiblingMatch = matching.getNew(rightSibling);
        const leftSiblingMatch = matching.getNew(leftSibling);

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
          if (potentialMatch.getRightSibling() != null) {
            continue;
          }

          //Case 3: Node has a right, but no left sibling
        } else if (rightSibling != null && leftSibling == null) {
          if (rightSiblingMatch.getLeftSibling() == null) {
            continue;
          }
          potentialMatch = rightSiblingMatch.getLeftSibling();
          //potential match cannot have a left sibling
          if (potentialMatch.getLeftSibling() != null) {
            continue;
          }
          //Case 4: Node has neither a left nor a right sibling, but the parent is matched
        } else if (matching.hasNew(newNode.parent)) {
          const parentMatch = matching.getNew(newNode.parent);
          if (parentMatch.degree() === 1) {
            potentialMatch = parentMatch.getChild(0);
          } else {
            continue;
          }
        } else {
          continue;
        }

        //Potential match must be unmatched and have the same label
        if (potentialMatch.label === newNode.label && !matching.hasOld(potentialMatch)) {
          matching.matchNew(newNode, potentialMatch);
        }
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