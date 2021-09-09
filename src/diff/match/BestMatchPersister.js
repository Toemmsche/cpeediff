/**
 * Persist the best matches. For each new node, the old node with the lowest
 * comparison value is chosen, as long as that node is not matched to another
 * node with a lower comparison value. Nodes are considered in the order they
 * are passed to this function.
 * @param {Array<Node>} oldNodes The nodes of the old tree to consider for a
 *     matching
 * @param {Array<Node>} newNodes The nodes of the new tree to consider for a
 *     matching
 * @param {Matching} matching The existing matching to be extended
 * @param {Function} keyFunction A function mapping each node to a key. Only
 *     nodes with the same key can be matched. The key can be a hash value or
 *     the node label.
 * @param {Function} compareFunction A function mapping each pair of nodes to a
 *     comparison value from the range [0;1].
 * @param {Function} matchHandler A function to execute when two nodes are
 *     chosen for a match.
 * @param {Function} thresholdFunction A boolean function to determine if a
 *     comparison value is sufficient for a match.
 */
export function persistBestMatches(oldNodes, newNodes, matching,
    keyFunction, compareFunction, matchHandler,
    thresholdFunction = (CV) => true) {
  const candidateMap = new Map();
  for (const oldNode of oldNodes) {
    const key = keyFunction(oldNode);
    if (!candidateMap.has(key)) {
      candidateMap.set(key, []);
    }
    candidateMap.get(key).push(oldNode);
  }

  const oldToNewMap = new Map();
  newNodeLoop: for (const newNode of newNodes) {
    // existing matches cannot be altered
    if (matching.isMatched(newNode)) {
      continue;
    }

    const key = keyFunction(newNode);
    if (!candidateMap.has(key)) {
      continue;
    }
    const candidates = candidateMap.get(key);

    let minCV = 1;
    let minCVNode = null;
    for (const oldNode of candidates) {
      // existing matches cannot be altered
      if (matching.isMatched(oldNode)) {
        continue;
      }
      // compare positionally only
      const CV = compareFunction(oldNode, newNode);
      // handle a perfect match
      if (CV === 0) {
        matchHandler(oldNode, newNode);
        oldToNewMap.delete(oldNode);
        continue newNodeLoop;
      } else if (CV < minCV &&
          thresholdFunction(CV) &&
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
  for (const [oldNode, bestMatch] of oldToNewMap) {
    matchHandler(oldNode, bestMatch.newNode);
  }
}
