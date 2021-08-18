import {AbstractMatchingAlgorithm} from './AbstractMatchingAlgorithm.js';
import {HashExtractor} from '../extract/HashExtractor.js';
import {Logger} from '../../util/Logger.js';
import {persistBestMatches} from './BestMatchPersister.js';

/**
 * A matching module that employs hashing to find robust matches efficiently.
 */
export class HashMatcher extends AbstractMatchingAlgorithm {
  /**
   * Extend the matching with matches between subtrees with an identical
   * hash value. If multiple subtrees have the same value, the first pair with
   * the lowest positional comparison value is matched.
   * @param {!Node} oldTree
   * @param {!Node} newTree
   * @param {!Matching} matching
   * @param {!StandardComparator} comparator
   */
  match(oldTree, newTree, matching, comparator) {
    // filter for unmatched nodes and sort new Nodes descending by size
    const oldNodes = oldTree
        .nonPropertyNodes()
        .filter((n) => !matching.hasAny(n));
    const newNodes = newTree
        .nonPropertyNodes()
        .filter((n) => !matching.hasAny(n))
        // match subtrees in a greedy fashion to save performance
        .sort((a, b) => comparator.compareSize(b, a));

    const hashExtractor = new HashExtractor();

    // build hash map with new Nodes first to allow ascending size traversal
    // later on
    const hashMap = new Map();
    for (const newNode of newNodes) {
      const hash = hashExtractor.get(newNode);
      if (!hashMap.has(hash)) {
        hashMap.set(hash, {
          oldNodes: [],
          newNodes: [],
        });
      }
      hashMap.get(hash).newNodes.push(newNode);
    }
    for (const oldNode of oldNodes) {
      const hash = hashExtractor.get(oldNode);
      // if the node's hash wil never find a partner, we don't bother adding it
      if (hashMap.has(hash)) {
        hashMap.get(hash).oldNodes.push(oldNode);
      }
    }

    /**
     * Match all nodes of two subtrees.
     * @param {!Node} oldRoot
     * @param {!Node} newRoot
     */
    const matchSubtrees = (oldRoot, newRoot) => {
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
        matching.matchNew(newPreOrder[i], oldPreOrder[i]);
      }
    };


    // map remembers insertion order
    for (const [, nodes] of hashMap) {
      persistBestMatches(nodes.oldNodes, nodes.newNodes, matching,
          (oldNode, newNode) => comparator.comparePosition(oldNode, newNode),
          matchSubtrees);
    }
    return matching;
  }
}

