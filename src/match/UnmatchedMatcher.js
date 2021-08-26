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
            .inners()
            .filter((node) => !matching.isMatched(node));
    for (const newNode of newInners) {
      // TODO not sure about this one
      if (newNode.isOtherwise() && matching.isMatched(newNode.parent)) {
        const parentMatch = matching.getMatch(newNode.parent);
        const potentialMatches =
            parentMatch.children.filter((node) => node.isOtherwise());
        if (potentialMatches.length > 1) {
          Logger.warn(
              'Choose node with multiple \'otherwise\' branches',
              this,
          );
        } else if (potentialMatches.length === 1 &&
            !matching.isMatched(potentialMatches[0])) {
          matching.matchNew(newNode, potentialMatches[0]);
          continue;
        }
      }

      const parentMatch = matching.getMatch(newNode.parent);
      let minCV = 1;
      let minCVNode = null;

      newNode.children.forEach((node) => {
        if (matching.isMatched(node)) {
          const match = matching.getMatch(node);
          if (match.parent.label === newNode.label &&
              !matching.isMatched(match.parent) &&
              match.parent.parent === parentMatch) {
            const CV = comparator.compare(newNode, match.parent);
            if (CV < minCV) {
              minCVNode = match.parent;
              minCV = CV;
            }
          }
        }
      });

      // Vertical sandwich has priority.
      if (minCVNode != null) {
        matching.matchNew(newNode, minCVNode);
      } else {
        const leftSibling = newNode.getLeftSibling();
        const rightSibling = newNode.getRightSibling();

        // Left or right sibling must either not exist, or be matched
        if ((leftSibling != null && !matching.isMatched(leftSibling)) ||
            (rightSibling != null && !matching.isMatched(rightSibling))) {
          continue;
        }

        const rightSiblingMatch = matching.getMatch(rightSibling);
        const leftSiblingMatch = matching.getMatch(leftSibling);

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
          // Potential match cannot have a right sibling
          if (potentialMatch.getRightSibling() != null) {
            continue;
          }

          // Case 3: Node has a right, but no left sibling
        } else if (rightSibling != null && leftSibling == null) {
          if (rightSiblingMatch.getLeftSibling() == null) {
            continue;
          }
          potentialMatch = rightSiblingMatch.getLeftSibling();
          // Potential match cannot have a left sibling
          if (potentialMatch.getLeftSibling() != null) {
            continue;
          }
          // Case 4: Node has neither a left nor a right sibling, but the parent
          // is matched
        } else if (matching.isMatched(newNode.parent)) {
          const parentMatch = matching.getMatch(newNode.parent);
          if (parentMatch.degree() === 1) {
            potentialMatch = parentMatch.getChild(0);
          } else {
            continue;
          }
        } else {
          continue;
        }

        // Potential match must be unmatched and have the same label
        if (potentialMatch.label === newNode.label &&
            !matching.isMatched(potentialMatch)) {
          matching.matchNew(newNode, potentialMatch);
        }
      }
    }
  }
}
