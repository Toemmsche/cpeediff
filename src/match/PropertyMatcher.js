import {AbstractMatchingAlgorithm} from './AbstractMatchingAlgorithm.js';

/**
 * A matching module dedicated to the matching or property nodes.
 */
export class PropertyMatcher extends AbstractMatchingAlgorithm {
  /**
   * Extend the matching with matches between property nodes of matched
   * leaf and inner nodes.
   * @param {Node} oldTree
   * @param {Node} newTree
   * @param {Matching} matching
   */
  match(oldTree, newTree, matching) {
    const newLeaves =
        newTree
            .leaves()
            .filter((node) => matching.hasNew(node)); // must be matched

    const matchProperties = (oldNode, newNode) => {
      // We assume that no two properties that are siblings in the xml tree
      // share the same label
      const oldLabelMap = new Map();
      for (const oldChild of oldNode) {
        if (!matching.hasOld(oldChild)) {
          oldLabelMap.set(oldChild.label, oldChild);
        }
      }
      for (const newChild of newNode) {
        if (!matching.hasNew(newChild)) {
          if (oldLabelMap.has(newChild.label)) {
            const match = oldLabelMap.get(newChild.label);
            matching.matchNew(newChild, match);
            // Theoretically, a repeated matching can occur if two arguments in
            // the new tree have the same name
            // Even though this situation is highly unlikely, we delete the
            // entry in the label map to prevent it.
            oldLabelMap.delete(newChild.label);
            matchProperties(match, newChild);
          }
        }
      }
    };

    for (const newLeaf of newLeaves) {
      if (matching.hasNew(newLeaf)) {
        matchProperties(matching.getNew(newLeaf), newLeaf);
      }
    }
  }
}
