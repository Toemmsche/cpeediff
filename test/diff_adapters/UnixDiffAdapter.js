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

import {TestConfig} from "../TestConfig.js";
import {DiffAdapter} from "./DiffAdapter.js";

export class UnixDiffAdapter extends DiffAdapter {

    constructor() {
        super(TestConfig.DIFFS.UNIXDIFF.path, TestConfig.DIFFS.UNIXDIFF.displayName);
    }

    _parseOutput(output) {
        let insertions = 0;
        let deletions = 0;

        for (const line of output.split("\n")) {
            if (line.startsWith("<")) {
                deletions++;
            } else if (line.startsWith(">")) {
                insertions++;
            }
        }
        //unix diff cannot detect moves or updates
        return [insertions, 0, 0, deletions, insertions + deletions];
    }
}


