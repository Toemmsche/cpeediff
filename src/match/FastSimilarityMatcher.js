import {MatcherInterface} from './MatcherInterface.js';
import {persistBestMatches} from './BestMatchPersister.js';
import {DiffConfig} from '../config/DiffConfig.js';
import {Dsl} from '../config/Dsl.js';

/**
 * A matching module that matches similar leaf nodes while enforcing
 * endpoint equality for call nodes.
 * The comparison logic resides in the passed comparator.
 * @implements MatcherInterface
 */
export class FastSimilarityMatcher {
  /**
   * Extend the matching with matches between sufficiently similar leaf nodes.
   * For each unmatched new leaf node, the old node with the lowest comparison
   * value that is better than that node's current best match is chosen. Matches
   * between call nodes are only allowed if their endpoints equal.
   * @param {Node} oldTree The root of the old (original) process tree
   * @param {Node} newTree The root of the new (changed) process tree
   * @param {Matching} matching The existing matching to be extended
   * @param {Comparator} comparator The comparator used for comparisons.
   */
  match(oldTree, newTree, matching, comparator) {
    // filter for unmatched leaf nodes
    const oldLeaves = oldTree
        .leaves()
        .filter((node) => !matching.isMatched(node));
    const newLeaves = newTree
        .leaves()
        .filter((node) => !matching.isMatched(node));

    // Only matches between nodes with the same label are allowed
    const keyFunction =
        (node) => node.isCall() ?
            node.label +
                node.attributes.get(Dsl.CALL_PROPERTIES.ENDPOINT.label) :
            node.label;
    const compareFunction = (oldNode, newNode) =>
      comparator.compare(oldNode, newNode);
    const matchFunction = (oldNode, newNode) =>
      matching.matchNew(newNode, oldNode);
    // Only sufficiently similar matches are accepted.
    const thresholdFunction = (CV) => CV <= DiffConfig.COMPARISON_THRESHOLD;

    persistBestMatches(oldLeaves, newLeaves, matching,
        keyFunction, compareFunction, matchFunction, thresholdFunction);
  }
}
