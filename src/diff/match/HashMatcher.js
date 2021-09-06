import {persistBestMatches} from './BestMatchPersister.js';
import {DiffConfig} from '../../config/DiffConfig.js';

/**
 * A matching module that employs hashing to find robust matches efficiently.
 * @implements {MatcherInterface}
 */
export class HashMatcher {
  /**
   * Extend the matching with matches between subtrees with an identical
   * hash value. If multiple subtrees have the same value, the first pair with
   * the lowest positional comparison value is matched.
   * @param {Node} oldTree The root of the old (original) process tree
   * @param {Node} newTree The root of the new (changed) process tree
   * @param {Matching} matching The existing matching to be extended
   * @param {Comparator} comparator The comparator used for comparisons.
   */
  match(oldTree, newTree, matching, comparator) {
    const oldNodes =
        oldTree
            .nonPropertyNodes()
            .filter((node) => !matching.isMatched(node));
    const newNodes =
        newTree
            .nonPropertyNodes()
            .filter((node) => !matching.isMatched(node))
            // Match subtrees in a greedy fashion (starting with the "heaviest")
            // to improve performance
            .sort((a, b) => comparator.compareSize(b, a));

    const hashExtractor = comparator.hashExtractor;

    const keyFunction = (node) => hashExtractor.get(node);
    const compareFunction =
        (oldNode, newNode) => comparator.comparePosition(oldNode, newNode);
    /**
     * Match all nodes of two subtrees.
     * @param {Node} oldRoot
     * @param {Node} newRoot
     */
    const matchFunction = (oldRoot, newRoot) => {
      // Don't match positionally dissimilar interrupt nodes
      if (oldRoot.isInnterruptLeafNode() &&
          compareFunction(oldRoot, newRoot) > DiffConfig.COMPARISON_THRESHOLD) {
        return;
      }
      // found a perfect match, match entire subtrees
      const newPreOrder = newRoot.toPreOrderArray();
      const oldPreOrder = oldRoot.toPreOrderArray();

      // stable sort both arrays because hash may ignore child order of
      // certain nodes
      newPreOrder.sort((a, b) =>
        hashExtractor.get(a) - hashExtractor.get(b));

      oldPreOrder.sort((a, b) =>
        hashExtractor.get(a) - hashExtractor.get(b));

      for (let i = 0; i < newPreOrder.length; i++) {
        if (!matching.isMatched(newPreOrder[i]) &&
            !matching.isMatched(oldPreOrder[i])) {
          matching.matchNew(newPreOrder[i], oldPreOrder[i]);
        }
      }
    };
    // every match is accepted when the hash values equal
    const threshOldFunction = (CV) => true;
    persistBestMatches(
        oldNodes,
        newNodes,
        matching,
        keyFunction,
        compareFunction,
        matchFunction,
        threshOldFunction,
    );
  }
}

