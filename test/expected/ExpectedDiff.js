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

import {AbstractExpected} from "./AbstractExpected.js";

export class ExpectedDiff extends AbstractExpected{

    maxSize;
    insertions;
    moves;
    updates;
    deletions;


    constructor( maxSize, insertions = 0, moves = 0, updates = 0, deletions  = 0) {
        super();
        this.maxSize = maxSize;
        this.insertions = insertions;
        this.moves = moves;
        this.updates = updates;
        this.deletions = deletions;
    }
}


