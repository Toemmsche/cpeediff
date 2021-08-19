import {AbstractMatchingAlgorithm} from './AbstractMatchingAlgorithm.js';
import {persistBestMatches} from './BestMatchPersister.js';
import {Config} from '../Config.js';

/**
 * A matching module that matches similar leaf nodes.
 * The comparison logic resides in the passed comparator.
 */
export class SimilarityMatcher extends AbstractMatchingAlgorithm {
  /**
   * Extend the matching with matches between sufficiently similar leaf nodes.
   * For each unmatched new leaf node, the old node with the lowest comparison
   * value that is better than that node's current best match is chosen.
   * @param {Node} oldTree
   * @param {Node} newTree
   * @param {Matching} matching
   * @param {Comparator} comparator
   */
  match(oldTree, newTree, matching, comparator) {
    // filter for unmatched leaf nodes
    const oldLeaves =
        oldTree
            .leaves()
            .filter((node) => !matching.hasAny(node));
    const newLeaves =
        newTree
            .leaves()
            .filter((node) => !matching.hasAny(node));

    // Only matches between nodes with the same label are allowed
    const keyFunction = (node) => node.label;
    const compareFunction =
        (oldNode, newNode) => comparator.compare(oldNode, newNode);
    const matchFunction =
        (oldNode, newNode) => matching.matchNew(newNode, oldNode);
    // Only sufficiently similar matches are accepted.
    const thresholdFunction = (CV) => CV <= Config.COMPARISON_THRESHOLD;

    persistBestMatches(oldLeaves, newLeaves, matching,
        keyFunction, compareFunction, matchFunction, thresholdFunction);
  }
}
