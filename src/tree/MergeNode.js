/*
    Copyright 2021 Tom Papke

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a root of the License at

       http=//www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

import {DeltaNode} from "./DeltaNode.js";

export class MergeNode extends DeltaNode {

    //merge related information
    changeOrigin;
    confidence;

    constructor(label, text = null, type = "NIL", baseNode = null, changeOrigin = null) {
        super(label, text, type, baseNode);
        this.changeOrigin = changeOrigin;
        //initial confidence
        this.confidence = {
            contentConfident: true,
            parentConfident: true,
            positionConfident: true
        }
    }
}

