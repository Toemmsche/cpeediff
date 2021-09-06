/**
 * A matching module dedicated to the matching or property nodes.
 * @implements {MatcherInterface}
 */
export class PropertyMatcher {
  /**
   * Extend the matching with matches between property nodes of matched
   * leaf and inner nodes.
   * @param {Node} oldTree The root of the old (original) process tree
   * @param {Node} newTree The root of the new (changed) process tree
   * @param {Matching} matching The existing matching to be extended
   * @param {Comparator} comparator The comparator used for comparisons.
   */
  match(oldTree, newTree, matching, comparator) {
    const newMatchedNodes =
        newTree
            .nonPropertyNodes()
            .filter((node) => matching.isMatched(node)); // must be matched

    const matchProperties = (oldNode, newNode) => {
      // We assume that no two properties that are siblings in the xml tree
      // share the same label
      const oldLabelMap = new Map();
      for (const oldChild of oldNode) {
        if (oldChild.isPropertyNode() && !matching.isMatched(oldChild)) {
          oldLabelMap.set(oldChild.label, oldChild);
        }
      }
      for (const newChild of newNode) {
        if (newChild.isPropertyNode() && !matching.isMatched(newChild)) {
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

    for (const newMatchedNode of newMatchedNodes) {
      matchProperties(matching.getMatch(newMatchedNode), newMatchedNode);
    }
  }
}
