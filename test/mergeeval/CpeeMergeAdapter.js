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

import {DeltaMerger} from "../../src/merge/DeltaMerger.js";
import {TestConfig} from "../TestConfig.js";
import {MergeTestResult} from "./MergeTestResult.js";
import {AbstractMergeAdapter} from "./AbstractMergeAdapter.js";

export class CpeeMergeAdapter extends AbstractMergeAdapter {

    mergeAlgorithm;

    constructor() {
        super(TestConfig.MERGES.CPEEMERGE.path, TestConfig.MERGES.CPEEMERGE.displayName);
        this.mergeAlgorithm = new DeltaMerger();
    }

    evalCase(name, base, branch1, branch2, expected, accepted) {
        let verdict = TestConfig.VERDICTS.OK;
        let merged;
        try {
            merged = this.mergeAlgorithm.merge(base, branch1, branch2);
        } catch (e) {
            verdict = TestConfig.VERDICTS.RUNTIME_ERROR;
        }

        if (verdict === TestConfig.VERDICTS.OK) {
            verdict = this._verifyResult(merged, expected, accepted);
        }
        return new MergeTestResult(name, this.displayName, verdict);
    }

    _verifyResult(output, expected, accepted) {
        //TODO disregard child order where applicable
        if (expected.some(t => t.deepEquals(output))) {
            return TestConfig.VERDICTS.OK;
        } else if (accepted.some(t => t.deepEquals(output))) {
            return TestConfig.VERDICTS.ACCEPTABLE;
        } else {
            return TestConfig.VERDICTS.WRONG_ANSWER;
        }
    }
}


