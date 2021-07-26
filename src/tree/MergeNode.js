/*
    Copyright 2021 Tom Papke

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http=//www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

import {DeltaNode} from "./DeltaNode.js";
import {Confidence} from "./Confidence.js";

/**
 * A node inside a CPEE process tree that is the result of a merge.
 * @extends DeltaNode
 * @property {Number} changeOrigin The branch in which this node was changed (either none: 0, branch 1: 1, branch 2: 2 or both: 3)
 * @property {Confidence} confidence An object containing testCase.information about the merge confidence regarding the node's
 * content, parent node, and position (within its parent's child list).
 */
export class MergeNode extends DeltaNode {

    //merge related information
    changeOrigin;
    confidence;

    /**
     * Construct a new MergeNode. Includes properties from {@see DeltaNode}.
     * @param {String} label The node label
     * @param {String} text The text content
     * @param {String} type The operation type associated with the node
     * @param {Number|null} baseNode The base node ID
     * @param {Number} changeOrigin The branch in which this node was changed (0 if unchanged)
     */
    constructor(label, text = null, type = "NIL", baseNode = null, changeOrigin = 0) {
        super(label, text, type, baseNode);
        this.changeOrigin = changeOrigin;
        //initial high confidence
        this.confidence = new Confidence(true, true, true);
    }
}

