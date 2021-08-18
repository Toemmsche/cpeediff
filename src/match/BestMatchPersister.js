/**
 * Persist the best matches.
 * @param {!Array<Node>} newNodes
 * @param {!Array<Node>}oldNodes
 * @param {!Matching} matching
 * @param {!Function} compareFunction
 * @param {!Function} matchHandler
 * @param {!Function} thresholdFunction
 */
export function persistBestMatches(newNodes, oldNodes, matching,
    compareFunction, matchHandler, thresholdFunction = (CV) => true) {
  const oldToNewMap = new Map();

  newNodeLoop: for (const newNode of newNodes) {
    // existing matches cannot be altered
    if (matching.hasNew(newNode)) {
      continue;
    }
    let minCV = 1;
    let minCVNode = null;
    for (const oldNode of oldNodes) {
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
          thresholdFunction(minCV) &&
          (!oldToNewMap.has(oldNode) ||
              minCV < oldToNewMap.get(oldNode).compareValue)) {
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
