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

import {Config} from "../Config.js";
import {AbstractMatchingAlgorithm} from "./AbstractMatchingAlgorithm.js";
import computeMunkres from "munkres-js";

export class HungSimMatcher extends AbstractMatchingAlgorithm {

    match(oldTree, newTree, matching, comparator) {
        //filter for unmatched nodes and sort ascending by size
        const oldNodes = oldTree.leaves().filter(n => !matching.hasAny(n));
        const newNodes = newTree.leaves().filter(n => !matching.hasAny(n));


        const matrix = new Array(newNodes.length);
        for (let i = 0; i < matrix.length; i++) {
            matrix[i] = new Array(oldNodes.length);
            for (let j = 0; j < matrix[i].length; j++) {
                const compValue = comparator.compare(newNodes[i], oldNodes[j]);
                    matrix[i][j] = compValue;
            }
        }

        const opt = computeMunkres(matrix);

        for(const [i, j] of opt) {
            if(matrix[i][j] <= Config.COMPARISON_THRESHOLD) {
                matching.matchNew(newNodes[i], oldNodes[j]);
            }
        }

    }
}