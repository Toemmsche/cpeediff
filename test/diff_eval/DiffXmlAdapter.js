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
import {AbstractDiffAdapter} from "./AbstractDiffAdapter.js";
import {DiffTestResult} from "./DiffTestResult.js";

export class DiffXmlAdapter extends AbstractDiffAdapter {

    constructor() {
        super(TestConfig.DIFFS.DIFFXML.path, TestConfig.DIFFS.DIFFXML.displayName);
    }

    evalCase(info, oldTree, newTree) {
        let exec = {};
        let time = new Date().getTime();
        try {
            exec = this._run(oldTree, newTree);
        } catch (e) {
            time = new Date().getTime() - time
            //For some reason, diffxml returns error even though the program executed
            if (e.code === "ETIMEDOUT") {
                console.log(this.displayName + " timed out for " + info.name);
                return DiffTestResult.timeout(info, this.displayName);
            } else {
                if(e.output != null && e.output[1].length > 0) {
                    exec.output = e.output[1].toString();
                    exec.runtime = time;
                } else {
                    console.log(this.displayName + " crashed for " + info.name + ": " + e.toString());
                    return DiffTestResult.fail(info, this.displayName);
                }
            }
        }
        const counters = this._parseOutput(exec.output);
        const changesFound = counters.reduce((a, b) => a + b, 0);
        return new DiffTestResult(info, this.displayName, exec.runtime, changesFound, ...counters, exec.output.length)
    }

}


