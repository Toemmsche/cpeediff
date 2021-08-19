import {AbstractMatchingAlgorithm} from './AbstractMatchingAlgorithm.js';

/**
 * Simple matching module executed at the start of each matching pipeline.
 */
export class FixedMatcher extends AbstractMatchingAlgorithm {
  /**
   * Match the root (and init script, if present) of the trees.
   * @param {Node} oldTree
   * @param {Node} newTree
   * @param {Matching} matching
   */
  match(oldTree, newTree, matching) {
    if (!matching.areMatched(oldTree, newTree)) {
      matching.matchNew(newTree, oldTree);
    }
    const oldFirstChild = oldTree.getChild(0);
    const newFirstChild = newTree.getChild(0);
    if (oldFirstChild != null &&
        oldFirstChild.attributes.get('id') === 'init') {
      if (newFirstChild.attributes.get('id') === 'init') {
        matching.matchNew(newFirstChild, oldTree.getChild(0));
      }
    }
  }
}

