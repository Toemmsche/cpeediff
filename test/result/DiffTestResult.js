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

import {AbstractTestResult} from "./AbstractTestResult.js";
import {TestConfig} from "../TestConfig.js";

export class DiffTestResult extends AbstractTestResult{

    constructor(caseName, algorithm, actual, verdict) {
        super(caseName, algorithm, actual, verdict);
    }

    /**
     * @return any[] An array of all values that should appear in the evaluation table.
     */
    valArr() {
        //A non-OK verdict indicates failure, fill array with it
        if(this.verdict === TestConfig.VERDICTS.TIMEOUT || this.verdict === TestConfig.VERDICTS.RUNTIME_ERROR) {
            return [this.algorithm, ...(new Array(7).fill(this.verdict))];
        }
        return [this.algorithm, this.actual.runtime, this.actual.changes,
            this.actual.insertions, this.actual.moves, this.actual.updates, this.actual.deletions, this.actual.diffSize];
    }

    /**
     * @return String[] An array containing the descriptors of all values that should appear in the evaluation table.
     */
    static header() {
        return ["Algorithm", "Runtime", "Total Changes", "Insertions", "Moves", "Updates", "Deletions", "Diff Size"];
    }
}


