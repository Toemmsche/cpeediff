import {DiffConfig} from '../../config/DiffConfig.js';

/**
 * A matching module that reconsiders unmatched nodes for a match
 * if certain conditions are met.
 * @implements {MatcherInterface}
 */
export class SandwichMatcher {
  /**
   * Extend the matching with matches that can be inferred from the matching
   * of surrounding nodes, e.g., if a node is vertically or horizontally
   * sandwiched between matches. To detect fuzzy matches, the comparison
   * threshold is raised for this matching module only.
   * @param {Node} oldTree The root of the old (original) process tree
   * @param {Node} newTree The root of the new (changed) process tree
   * @param {Matching} matching The existing matching to be extended
   * @param {Comparator} comparator The comparator used for comparisons.
   */
  match(oldTree, newTree, matching, comparator) {
    const newInners = newTree
        .nonPropertyNodes()
        .filter((node) => !matching.isMatched(node));
    for (const newNode of newInners) {
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
            !matching.isMatched(potentialMatch) &&
            (!(newNode.isCall() || newNode.isScript()) ||
                comparator.compareContent(newNode, potentialMatch) <=
                DiffConfig.RELAXED_THRESHOLD)) {
          matching.matchNew(newNode, potentialMatch);
        }
      }
    }
  }
}
