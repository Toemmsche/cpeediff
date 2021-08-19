/**
 * Persist the best matches.
 * @param {Array<Node>}oldNodes
 * @param {Array<Node>} newNodes
 * @param {Matching} matching
 * @param {Function} keyFunction
 * @param {Function} compareFunction
 * @param {Function} matchHandler
 * @param {Function} thresholdFunction
 */
export function persistBestMatches(oldNodes, newNodes, matching,
    keyFunction, compareFunction, matchHandler,
    thresholdFunction = (CV) => true) {
  const candidateMap = new Map();
  if (keyFunction != null) {
    for (const oldNode of oldNodes) {
      const key = keyFunction(oldNode);
      if (!candidateMap.has(key)) {
        candidateMap.set(key, []);
      }
      candidateMap.get(key).push(oldNode);
    }
  }
  const oldToNewMap = new Map();
  newNodeLoop: for (const newNode of newNodes) {
    // existing matches cannot be altered
    if (matching.hasNew(newNode)) {
      continue;
    }
    let candidates;
    if (keyFunction != null) {
      const key = keyFunction(newNode);
      if (!candidateMap.has(key)) {
        continue;
      }
      candidates = candidateMap.get(key);
    } else {
      candidates = oldNodes;
    }
    let minCV = 1;
    let minCVNode = null;
    for (const oldNode of candidates) {
      // existing matches cannot be altered
      if (matching.hasOld(oldNode)) {
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
