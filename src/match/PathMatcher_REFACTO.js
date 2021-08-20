/*
    Copyright 2021 Tom Papke

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

import {Config} from '../Config.js';
import {MatcherInterface} from './MatcherInterface.js';
import {persistBestMatches} from './BestMatchPersister.js';

export class PathMatcher extends MatcherInterface {
  match(oldTree, newTree, matching, comparator) {
    /**
     * @type {Map<Node, Set<Node>>}
     */
    let candidateMap = new Map();
    for (const [newNode, oldNode] of matching.newToOldMap) {
      // copy paths, reverse them and remove first element, discard already
      // matched nodes
      const oldPath =
          oldNode
              .path()
              .slice()
              .reverse()
              .slice(1)
              .filter((node) => !matching.hasOld(node));
      let newPath =
          newNode
              .path()
              .slice()
              .reverse()
              .slice(1)
              .filter((node) => !matching.hasNew(node));
      oldNodeLoop:
      for (const oldNode of oldPath) {
        for (const newNode of newPath) {
          if (candidateMap.has(oldNode) &&
                candidateMap.get(oldNode).has(newNode)) {
            // cut everything from oldNode upwards from oldPath
            const newNodeIndex = newPath.indexOf(newNode);
            newPath = newPath.slice(0, newNodeIndex);
            continue oldNodeLoop;
          }

          // Label equality must be ensured
          if (oldNode.label === newNode.label) {
            if (!candidateMap.has(oldNode)) {
              candidateMap.set(oldNode, new Set());
            }
            // Set remembers insertion order
            candidateMap.get(oldNode).add(newNode);
          }
        }
      }
    }

    // To avoid suboptimal matches, the candidate map is sorted ascending by
    // size of the candidate set. As a result, unique matches are found first
    // and not overwritten by more vague matches.
    candidateMap = new Map([...candidateMap.entries()]
        .sort((a, b) => a[1].size - b[1].size));

    const newInners =
        [...candidateMap.entries()]
            .sort((entry1, entry2) => entry1[1].size - entry2[1].size)
            .map((entry) => entry[0]); // extract key
    const oldInners =
        oldTree
            .innerNodes()
            .filter((node) => !matching.hasOld(node))
            .sort((a, b) => comparator.compareSize(a, b));
    const newInnerSet = new Set(newInners);
    const oldInnerSet = new Set(oldInners);
    const keyFunction = (node) => {
      if (oldInnerSet.has(node)) {
        return node;
      } else {

      }
    };
    const compareFunction =
        (oldNode, newNode) => comparator.compare(newNode, oldNode);
    const matchFunction =
        (oldNode, newNode) => matching.matchNew(newNode, oldNode);
    const thresholdFunction = (CV) => CV <= Config.COMPARISON_THRESHOLD;

    persistBestMatches(oldInners, newInners, matching,
        keyFunction, compareFunction, matchFunction, thresholdFunction);
  }
}
