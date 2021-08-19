import {Config} from '../Config.js';
import {AbstractMatchingAlgorithm} from './AbstractMatchingAlgorithm.js';
import {LeafSetExtractor} from '../extract/LeafSetExtractor.js';

export class CommonalityPathMatcher extends AbstractMatchingAlgorithm {

  _leafSetExtractor;

  match(oldTree, newTree, matching, comparator) {
    this._leafSetExtractor = new LeafSetExtractor();

    //use a temporary map until the best matches are found
    /**
     * @type {Map<Node, Set<Node>>}
     */
    let candidateMap = new Map();

    //Match inner nodes that are along the path of already matched nodes.
    for (const [newNode, oldNode] of matching.newToOldMap) {

      //copy paths, reverse them and remove first element, discard already matched nodes
      const newPath = newNode.path().slice().reverse().slice(1).filter(n => !matching.hasNew(n));
      let oldPath = oldNode.path().slice().reverse().slice(1).filter(n => !matching.hasOld(n));

      newNodeLoop: for (const newNode of newPath) {
        for (const oldNode of oldPath) {

          if (candidateMap.has(newNode) && candidateMap.get(newNode).has(oldNode)) {
            //cut everything from oldNode upwards from oldPath
            const oldNodeIndex = oldPath.indexOf(oldNode);
            oldPath = oldPath.slice(0, oldNodeIndex);
            continue newNodeLoop;
          }

          //Label equality must be ensured
          if (newNode.label === oldNode.label) {
            if (!candidateMap.has(newNode)) {
              candidateMap.set(newNode, new Set());
            }
            //Set remembers insertion order
            candidateMap.get(newNode).add(oldNode);
          }
        }
      }
    }

    /*
    To avoid suboptimal matches, the candidate map is sorted ascending by size of the candidate set.
    As a result, unique matches are found first and not overwritten by more vague matches.
     */
    candidateMap = new Map([...candidateMap.entries()].sort((a, b) => a[1].size - b[1].size));

    //use a temporary map until the best matches are found
    const oldToNewMap = new Map();
    mapLoop: for (const [newNode, oldNodeSet] of candidateMap) {
      //the minimum compare value
      let minCompareValue = 1;
      let minCompareNode = null;
      for (const oldNode of oldNodeSet) {
        //perfect matches
        if (matching.hasOld(oldNode)) continue;
        const compareValue = (comparator.compare(newNode, oldNode) + this.commonality(newNode, oldNode, matching)) / 2;

        //Perfect match? => add to M and resume with different node
        if (compareValue === 0) {
          matching.matchNew(newNode, oldNode);
          oldToNewMap.delete(oldNode);
          continue mapLoop;
        }

        if (compareValue < minCompareValue) {
          minCompareValue = compareValue;
          minCompareNode = oldNode;
        }
      }
      if (minCompareValue < Config.COMPARISON_THRESHOLD) {

        //ensure (partial) one-to-one matching
        if (!oldToNewMap.has(minCompareNode) || minCompareValue < oldToNewMap.get(minCompareNode).compareValue) {
          oldToNewMap.set(minCompareNode, {
            newNode: newNode,
            compareValue: minCompareValue
          });
        }
      }
    }

    //the best matches can be persisted
    for (const [oldNode, bestMatch] of oldToNewMap) {
      matching.matchNew(bestMatch.newNode, oldNode);
    }
  }

  commonality(newNode, oldNode, matching) {
    let common = 0;
    const newSet = this._leafSetExtractor.get(newNode);
    const oldSet = this._leafSetExtractor.get(oldNode);

    for (const newCand of newSet) {
      if (matching.hasNew(newCand) && oldSet.has(matching.getNew(newCand))) {
        common++;
      }
    }

    return 1 - (common / (Math.max(newSet.size, oldSet.size)));
  }
}