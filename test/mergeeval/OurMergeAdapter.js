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

const assert = require("assert");
const fs = require("fs");
const {XmlFactory} = require("../../src/factory/XmlFactory");
const {MergeTestResult} = require("./MergeTestResult");
const {DeltaMerger} = require("../../src/merge/DeltaMerger");
const {SizeExtractor} = require("../../src/extract/SizeExtractor");
const {TestConfig} = require("../TestConfig");
const {ChawatheMatching} = require("../../src/matching/ChawatheMatch");
const {IdExtractor} = require("../../src/extract/IdExtractor");

class OurMergeAdapter {

    mergeAlgorithm;

    constructor() {
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
        return new MergeTestResult(name, "DeltaMerge", verdict);
    }

    _verifyResult(actual, expected, accepted) {
        if (expected.some(t => t.root.deepEquals(actual.root))) {
            return TestConfig.VERDICTS.OK;
        } else if(accepted.some(t => t.root.deepEquals(actual.root))) {
            return TestConfig.VERDICTS.ACCEPTABLE;
        } else {
            return TestConfig.VERDICTS.WRONG_ANSWER;
        }
    }
}

exports.OurMergeAdapter = OurMergeAdapter;
