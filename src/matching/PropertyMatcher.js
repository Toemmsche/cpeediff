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

import {AbstractMatchingAlgorithm} from "./AbstractMatchingAlgorithm.js";

export class PropertyMatcher extends AbstractMatchingAlgorithm {

    match(oldTree, newTree, matching) {
        const newLeaves = newTree.leaves().filter(n => matching.hasNew(n));

        //match properties of leaf nodes
        for (const newLeaf of newLeaves) {
            if (matching.hasNew(newLeaf)) {
                this._matchProperties(matching.getNew(newLeaf), newLeaf, matching);
            }
        }
    }

    _matchProperties(oldNode, newNode, matching) {
        //We assume that no two properties that are siblings in the xml tree share the same label
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
                    this._matchProperties(match, newChild, matching);
                }
            }
        }
    }
}