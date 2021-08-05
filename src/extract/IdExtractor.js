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

import {AbstractExtractor} from "./AbstractExtractor.js";

export class IdExtractor extends AbstractExtractor {

    _extract(node) {
        //compute all ids on first use
        let root;
        if(node.parent == null) {
            root = node;
        } else {
            root = node.path[0].parent;
        }
        const preOrder = root.toPreOrderArray();
        for (let i = 0; i < preOrder.length; i++) {
            this._memo.set(preOrder[i], i);
        }
    }

}