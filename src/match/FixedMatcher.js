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

export class FixedMatcher extends AbstractMatchingAlgorithm {

    match(oldTree, newTree, matching) {
        //root is always matched
        if (!matching.areMatched(oldTree, newTree)) {
            matching.matchNew(newTree, oldTree);
        }

        //init script is always matched
        const oldFirstChild = oldTree.getChild(0);
        const newFirstChild = newTree.getChild(0);
        if (oldFirstChild != null && oldFirstChild.attributes.get("id") === "init") {
            if (newFirstChild.attributes.get("id") === "init") {
                matching.matchNew(newFirstChild, oldTree.getChild(0));
            }
        }
    }
}

