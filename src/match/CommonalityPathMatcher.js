import {Config} from '../Config.js';
import {LeafSetExtractor} from '../extract/LeafSetExtractor.js';

/**
 * A matching module that uses the existing matches to find good matches
 * between inner nodes. Also considers the commonality between subtrees.
 * @implements {MatcherInterface}
 */
export class CommonalityPathMatcher {
  /** @type {LeafSetExtractor} */
  #leafSetExtractor;

  /**
   * Compute the commonality between two subtrees as a comparison value. The
   * commonality is defined as the number of overlapping leaves. Leaves are
   * considered 'equal' if they are matched.
   * @param {Node} oldNode The root of the subtree from the old process tree.
   * @param {Node} newNode The root of the subtree from the new process tree.
   * @param {Matching} matching The matching used to determine equality between
   *     leaves.
   * @return {Number} A comparison value for the commonality from the range
   *     [0;1]. 0 indicates full overlap, 1 indicates no overlap.
   */
  #commonality(oldNode, newNode, matching) {
    let common = 0;
    const newSet = this.#leafSetExtractor.get(newNode);
    const oldSet = this.#leafSetExtractor.get(oldNode);

    for (const newCand of newSet) {
      if (matching.isMatched(newCand) && oldSet.has(matching.getMatch(newCand))) {
        common++;
      }
    }

    return 1 - (common / (Math.max(newSet.size, oldSet.size)));
  }

  /**
   * Extend the matching with inner nodes matches that are found along the path
   * of already matched leaves. Also considers the commonality between subtrees.
   * @param {Node} oldTree The root of the old (original) process tree
   * @param {Node} newTree The root of the new (changed) process tree
   * @param {Matching} matching The existing matching to be extended
   * @param {Comparator} comparator The comparator used for comparisons.
   */
  match(oldTree, newTree, matching, comparator) {
    this.#leafSetExtractor = new LeafSetExtractor();

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
        const CV = comparator.weightedAverage(
            [
              comparator.compareContent(oldNode, newNode),
              comparator.comparePosition(oldNode, newNode),
              this.#commonality(oldNode, newNode, matching),
            ],
            [
              Config.COMPARATOR.CONTENT_WEIGHT,
              Config.COMPARATOR.POSITION_WEIGHT,
              Config.COMPARATOR.COMMONALITY_WEIGHT,
            ],
        );

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
