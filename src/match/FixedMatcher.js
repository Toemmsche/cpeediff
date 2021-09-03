import {MatcherInterface} from './MatcherInterface.js';

/**
 * Simple matching module executed at the start of each matching pipeline.
 * @implements {MatcherInterface}
 */
export class FixedMatcher {
  /**
   * Match the root (and init script, if present) of the trees.
   * @param {Node} oldTree The root of the old (original) process tree
   * @param {Node} newTree The root of the new (changed) process tree
   * @param {Matching} matching The existing matching to be extended
   * @param {Comparator} comparator The comparator used for comparisons.
   */
  match(oldTree, newTree, matching, comparator) {
    if (!matching.areMatched(oldTree, newTree)) {
      matching.matchNew(newTree, oldTree);
    }
    const oldFirstChild = oldTree.getChild(0);
    const newFirstChild = newTree.getChild(0);
    if (oldFirstChild != null &&
        newFirstChild != null &&
        oldFirstChild.attributes.get('id') === 'init' &&
        newFirstChild.attributes.get('id') === 'init') {
      matching.matchNew(newFirstChild, oldTree.getChild(0));
    }
  }
}

