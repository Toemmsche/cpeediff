import {MatcherInterface} from './MatcherInterface.js';
import {Logger} from '../../util/Logger.js';

/**
 * A matching module that reconsiders unmatched nodes for a match
 * if certain conditions are met.
 * @implements {MatcherInterface}
 */
export class UnmatchedMatcher {
  /**
   * @param {Node} node The input node
   * @param {Function} boolFunc A boolean function taking a single node as an
   *     argument.
   * @return {Boolean} True if the input node is null (soft equality)
   *     or the boolean function evaluates to true.
   * @private
   */
  _nullOrTrue(node, boolFunc) {
    if (node == null) return true;
    return boolFunc(node);
  }

  /**
   * Extend the matching with matches that can be inferred from the matching
   * of surrounding nodes, e.g., if a node is vertically or horizontally
   * sandwiched between matches.
   * @param {Node} oldTree The root of the old (original) process tree
   * @param {Node} newTree The root of the new (changed) process tree
   * @param {Matching} matching The existing matching to be extended
   * @param {Comparator} comparator The comparator used for comparisons.
   */
  match(oldTree, newTree, matching, comparator) {
    const newInners =
        newTree
            .innerNodes()
            .filter((node) => !matching.hasNew(node));
    for (const newNode of newInners) {
      if (newNode.isOtherwise() && matching.hasNew(newNode.parent)) {
        const parentMatch = matching.getNew(newNode.parent);
        const potentialMatches =
            parentMatch.children.filter((node) => node.isOtherwise());
        if (potentialMatches.length > 1) {
          Logger.warn('Choose node with multiple \'otherwise\' branches',
              this);
        } else if (potentialMatches.length === 1 &&
            !matching.hasOld(potentialMatches[0])) {
          matching.matchNew(newNode, potentialMatches[0]);
          continue;
        }
      }

      const parentMatch = matching.getNew(newNode.parent);
      let minCV= 1;
      let minCVNode = null;

      newNode.children.forEach((node) => {
        if (matching.hasNew(node)) {
          const match = matching.getNew(node);
          if (match.parent.label === newNode.label &&
              !matching.hasOld(match.parent) &&
              match.parent.parent === parentMatch) {
            const CV = comparator.compare(newNode, match.parent);
            if (CV < minCV) {
              minCVNode = match.parent;
              minCV = CV;
            }
          }
        }
      });

      // vertical sandwich has priority
      if (minCVNode != null) {
        matching.matchNew(newNode, minCVNode);
      } else {
        const leftSibling = newNode.getLeftSibling();
        const rightSibling = newNode.getRightSibling();

        // Left or right sibling must either not exist, or be matched
        if (!this._nullOrTrue(leftSibling, (n) => matching.hasNew(n)) ||
            !this._nullOrTrue(rightSibling, (n) => matching.hasNew(n))) {
          continue;
        }

        const rightSiblingMatch = matching.getNew(rightSibling);
        const leftSiblingMatch = matching.getNew(leftSibling);

        let potentialMatch;

        // Case 1: Node has both a right and a left sibling
        if (leftSibling != null && rightSibling != null) {
          if (rightSiblingMatch.getLeftSibling() == null ||
              rightSiblingMatch.getLeftSibling() !==
              leftSiblingMatch.getRightSibling()) {
            continue;
          }
          potentialMatch = rightSiblingMatch.getLeftSibling();

          // Case 2: Node has a left, but no right sibling
        } else if (rightSibling == null && leftSibling != null) {
          if (leftSiblingMatch.getRightSibling() == null) {
            continue;
          }
          potentialMatch = leftSiblingMatch.getRightSibling();
          // potential match cannot have a right sibling
          if (potentialMatch.getRightSibling() != null) {
            continue;
          }

          // Case 3: Node has a right, but no left sibling
        } else if (rightSibling != null && leftSibling == null) {
          if (rightSiblingMatch.getLeftSibling() == null) {
            continue;
          }
          potentialMatch = rightSiblingMatch.getLeftSibling();
          // potential match cannot have a left sibling
          if (potentialMatch.getLeftSibling() != null) {
            continue;
          }
          // Case 4: Node has neither a left nor a right sibling, but the parent
          // is matched
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

        // potential match must be unmatched and have the same label
        if (potentialMatch.label === newNode.label &&
            !matching.hasOld(potentialMatch)) {
          matching.matchNew(newNode, potentialMatch);
        }
      }
    }
  }

}