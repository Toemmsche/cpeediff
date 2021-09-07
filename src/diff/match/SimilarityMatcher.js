import {MatcherInterface} from './MatcherInterface.js';
import {persistBestMatches} from './BestMatchPersister.js';
import {DiffConfig} from '../../config/DiffConfig.js';
import {MatchPipeline} from './MatchPipeline.js';
import {Dsl} from '../../config/Dsl.js';

/**
 * A matching module that matches similar leaf nodes.
 * The comparison logic resides in the passed comparator.
 * @implements {MatcherInterface}
 */
export class SimilarityMatcher {
  /**
   * Whether the endpoints of call nodes should be forced to equal each other.
   * @type {Boolean}
   * @const
   */
  #endpointEquality;

  /**
   * Construct a new SimilarityMatcher instance.
   * @param {Boolean} endpointEquality Whether the endpoints of call nodes
   *     should be forced to equal each other.
   */
  constructor(endpointEquality) {
    this.#endpointEquality = endpointEquality;
  }

  /**
   * Extend the matching with matches between sufficiently similar leaf nodes.
   * For each unmatched new leaf node, the old node with the lowest comparison
   * value that is better than that node's current best match is chosen.
   * @param {Node} oldTree The root of the old (original) process tree
   * @param {Node} newTree The root of the new (changed) process tree
   * @param {Matching} matching The existing matching to be extended
   * @param {Comparator} comparator The comparator used for comparisons.
   */
  match(oldTree, newTree, matching, comparator) {
    // filter for unmatched leaf nodes
    const oldLeaves =
        oldTree
            .leaves()
            .filter((leaf) => !matching.isMatched(leaf) &&
                !leaf.isInnterruptLeafNode());
    const newLeaves =
        newTree
            .leaves()
            .filter((leaf) => !matching.isMatched(leaf) &&
                !leaf.isInnterruptLeafNode());

    // Only matches between nodes with the same label are allowed. In fast
    // mode, matches between call nodes are restricted to nodes with the same
    // endpoint.
    let keyFunction;
    if (this.#endpointEquality) {
      keyFunction = (node) =>
          node.isCall() ?
          node.label + node.attributes.get(Dsl.CALL_PROPERTIES.ENDPOINT.label) :
          node.label;
    } else {
      keyFunction = (node) => node.label;
    }

    const compareFunction =
        (oldNode, newNode) => comparator.compare(oldNode, newNode);
    const matchFunction =
        (oldNode, newNode) => matching.matchNew(newNode, oldNode);
    // Only sufficiently similar matches are accepted.
    const thresholdFunction = (CV) => CV <= DiffConfig.COMPARISON_THRESHOLD;

    persistBestMatches(
        oldLeaves,
        newLeaves,
        matching,
        keyFunction,
        compareFunction,
        matchFunction,
        thresholdFunction,
    );
  }
}
