import {Config} from '../Config.js';

/**
 * A matching module that uses the existing matches to find good matches
 * between inner nodes. Does not consider the commonality between subtrees.
 * @implements {MatcherInterface}
 */
export class PathMatcher {
  /**
   * Extend the matching with inner nodes matches that are found along the path
   * of already matched leaves. Does not consider the commonality between
   * subtrees.
   * @param {Node} oldTree The root of the old (original) process tree
   * @param {Node} newTree The root of the new (changed) process tree
   * @param {Matching} matching The existing matching to be extended
   * @param {Comparator} comparator The comparator used for comparisons.
   */
  match(oldTree, newTree, matching, comparator) {
    // Store all candidates for an inner node
    /**
     * @type {Map<Node, Set<Node>>}
     */
    let candidateMap = new Map();

    // Starting point is existing matches between leaves
    for (const [newNode, oldNode] of matching.newToOldMap) {
      // copy paths, reverse them and remove first element, discard already
      // matched nodes
      const newPath =
          newNode
              .path() // Reverse is in-place
              .reverse()
              .slice(1)
              .filter((node) => !matching.isMatched(node));
      let oldPath =
          oldNode
              .path() // Reverse is in-place
              .reverse()
              .slice(1)
              .filter((node) => !matching.isMatched(node));

      newNodeLoop: for (const newNode of newPath) {
        for (const oldNode of oldPath) {
          // If a candidate has already been captured, we can skip
          // duplicate candidate pairs along the paths.
          if (candidateMap.has(newNode) &&
              candidateMap.get(newNode).has(oldNode)) {
            // Nodes along the new path have can have old nodes from the
            // non-duplicate part of the old path as candidates.
            // Only the duplicate part is cut off.
            const oldNodeIndex = oldPath.indexOf(oldNode);
            oldPath = oldPath.slice(0, oldNodeIndex);
            continue newNodeLoop;
          }

          // Label equality must be ensured
          if (newNode.label === oldNode.label) {
            if (!candidateMap.has(newNode)) {
              candidateMap.set(newNode, new Set());
            }
            // Set remembers insertion order
            candidateMap.get(newNode).add(oldNode);
          }
        }
      }
    }

    // To avoid suboptimal matches, the candidate map is sorted ascending by
    // size of the candidate set. As a result, unique and therefore robust
    // matches are found first and not overwritten by more vague matches.
    candidateMap = new Map([...candidateMap.entries()]
        .sort((entryA, entryB) => entryA[1].size - entryB[1].size));

    // Sadly, we cannot use the persistBestMatches() function for this matching
    // module because of the unique order the candidates are dealt with.
    const oldToNewMap = new Map();
    mapLoop: for (const [newNode, oldNodeSet] of candidateMap) {
      // Remember the minimum comparison value
      let minCV = 1;
      let minCVNode = null;
      for (const oldNode of oldNodeSet) {
        if (matching.isMatched(oldNode)) continue;
        const CV = comparator.compare(oldNode, newNode);

        // Perfect match? => add to M and resume with different node
        if (CV === 0) {
          matching.matchNew(newNode, oldNode);
          oldToNewMap.delete(oldNode);
          continue mapLoop;
        } else if (CV <= Config.COMPARISON_THRESHOLD && CV < minCV &&
            (!oldToNewMap.has(oldNode) ||
                CV < oldToNewMap.get(oldNode).compareValue)) {
          minCV = CV;
          minCVNode = oldNode;
        }
      }
      if (minCVNode != null) {
        oldToNewMap.set(minCVNode, {
          newNode: newNode,
          compareValue: minCV,
        });
      }
    }

    // Persist the best matches
    for (const [oldNode, bestMatch] of oldToNewMap) {
      matching.matchNew(bestMatch.newNode, oldNode);
    }
  }
}
