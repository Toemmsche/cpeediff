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
import {Preprocessor} from "../../src/io/Preprocessor.js";
import * as fs from "fs";
import {AggregateMergeResult} from "./AggregateMergeResult.js";
import {MarkDownFactory} from "../util/MarkDownFactory.js";
import {_3dmAdapter} from "./_3dmAdapter.js";
import {CpeeMergeAdapter} from "./CpeeMergeAdapter.js";
import {XccPatchAdapter} from "./XccPatchAdapter.js";
import {Logger} from "../../Logger.js";
import {DirectoryScraper} from "../util/DirectoryScraper.js";

export class MergeAlgorithmEvaluation {

    adapters;

    constructor(adapters = []) {
        this.adapters = adapters;
    }

    static all() {
        let adapters = [new _3dmAdapter(), new XccPatchAdapter()];
        adapters = adapters.filter(a => fs.existsSync(a.pathPrefix + "/" + TestConfig.RUN_SCRIPT_FILENAME));
        adapters.unshift(new CpeeMergeAdapter());
        return new MergeAlgorithmEvaluation(adapters);
    }

    evalAll(caseDir = TestConfig.MERGE_CASES_DIR) {
        Logger.info("Using " + caseDir + " to evaluate merge algorithms", this);

        const resultsPerAdapter = new Map();
        const resultsPerTest = new Map();
        for (const adapter of this.adapters) {
            resultsPerAdapter.set(adapter, []);
        }

        const parser = new Preprocessor();

        //collect all directories representing testCases
        const caseDirs = DirectoryScraper.scrape(rootDir);
        for (const testCaseDir of caseDirs) {
            const testCaseName = testCaseDir.split("/").pop();
            let base;
            let branch1;
            let branch2;
            let expected = [];
            let accepted = [];

            fs.readdirSync(testCaseDir).forEach((file) => {
                    const content = fs.readFileSync(testCaseDir + "/" + file).toString();
                    if (file === TestConfig.BASE_FILE_NAME) {
                        base = parser.parseWithMetadata(content);
                    } else if (file === TestConfig.BRANCH_1_FILE_NAME) {
                        branch1 = parser.parseWithMetadata(content);
                    } else if (file === TestConfig.BRANCH_2_FILE_NAME) {
                        branch2 = parser.parseWithMetadata(content);
                    } else if (file.startsWith(TestConfig.EXPECTED_MERGE_PREFIX)) {
                        expected.push(parser.parseWithMetadata(content));
                    } else if (file.startsWith(TestConfig.ACCEPTED_MERGE_PREFIX)) {
                        accepted.push(parser.parseWithMetadata(content));
                    }
                }
            );
            if (base == null || branch1 == null || branch2 == null || expected.length === 0) {
                //test case is incomplete => skip
                Logger.warn("Skip case " + testCaseName + " due to missing files", this);
                return;
            }

            resultsPerTest.set(testCaseName, []);
            for (const adapter of this.adapters) {
                Logger.info("Running merge case " + testCaseName + " for " + adapter.displayName + "...", this);

                const result = adapter.evalCase(testCaseName, base, branch1, branch2, expected, accepted)
                resultsPerAdapter.get(adapter).push(result);
                resultsPerTest.get(testCaseName).push(result);
            }
        }

        const aggregateResults = [];
        for (const [adapter, resultsList] of resultsPerAdapter) {
            let okCount = 0;
            let acceptableCount = 0;
            let wrongAnswerCount = 0;
            let runtimeErrorCount = 0;
            for (const result of resultsList) {
                if (result.verdict === TestConfig.VERDICTS.OK) {
                    okCount++;
                } else if (result.verdict === TestConfig.VERDICTS.ACCEPTABLE) {
                    acceptableCount++;
                } else if (result.verdict === TestConfig.VERDICTS.WRONG_ANSWER) {
                    wrongAnswerCount++;
                } else if (result.verdict === TestConfig.VERDICTS.RUNTIME_ERROR) {
                    runtimeErrorCount++;
                }
            }

            aggregateResults.push(new AggregateMergeResult(adapter.displayName, okCount, acceptableCount, wrongAnswerCount, runtimeErrorCount));
        }
        Logger.result("Results:\n" + MarkDownFactory.tabularize(aggregateResults), this);
    }


}

