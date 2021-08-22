import {MatcherInterface} from './MatcherInterface.js';
import {HashExtractor} from '../extract/HashExtractor.js';
import {Logger} from '../../util/Logger.js';
import {persistBestMatches} from './BestMatchPersister.js';

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
    // filter for unmatched nodes and sort new Nodes descending by size
    const oldNodes =
        oldTree
            .nonPropertyNodes()
            .filter((node) => !matching.hasAny(node));
    const newNodes =
        newTree
            .nonPropertyNodes()
            .filter((node) => !matching.hasAny(node))
            // match subtrees in a greedy fashion to save performance
            .sort((a, b) => comparator.compareSize(b, a));

    const hashExtractor = new HashExtractor();

    const keyFunction = (node) => hashExtractor.get(node);
    const compareFunction =
        (oldNode, newNode) => comparator.comparePosition(oldNode, newNode);
    /**
     * Match all nodes of two subtrees.
     * @param {Node} oldRoot
     * @param {Node} newRoot
     */
    const matchFunction = (oldRoot, newRoot) => {
      // found a perfect match, match entire subtrees
      const newPreOrder = newRoot.toPreOrderArray();
      const oldPreOrder = oldRoot.toPreOrderArray();
      if (newPreOrder.length !== oldPreOrder.length) {
        Logger.error('Matching of subtrees with different size',
            new Error('Matching of subtrees with different size'), this);
      }

      // stable sort both arrays because hash may ignore child order of
      // certain nodes
      newPreOrder.sort((a, b) =>
        hashExtractor.get(a) - hashExtractor.get(b));

      oldPreOrder.sort((a, b) =>
        hashExtractor.get(a) - hashExtractor.get(b));

      for (let i = 0; i < newPreOrder.length; i++) {
        if (!matching.hasNew(newPreOrder[i]) &&
            !matching.hasOld(oldPreOrder[i])) {
          matching.matchNew(newPreOrder[i], oldPreOrder[i]);
        }
      }
    };
    // every match is accepted because the hash values equal
    const threshOldFunction = (CV) => true;
    persistBestMatches(oldNodes, newNodes, matching, keyFunction,
        compareFunction, matchFunction, threshOldFunction);
  }
}

