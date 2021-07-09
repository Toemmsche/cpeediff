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
import {MarkDownFactory} from "../MarkDownFactory.js";
import {_3dmAdapter} from "./_3dmAdapter.js";
import {CpeeMergeAdapter} from "./CpeeMergeAdapter.js";
import {XccPatchAdapter} from "./XccPatchAdapter.js";

export class MergeAlgorithmEvaluation {

    adapters;

    constructor(adapters = []) {
        this.adapters = adapters;
    }

    static all() {
        let adapters = [new _3dmAdapter(), new XccPatchAdapter()];
        adapters = adapters.filter(a => fs.existsSync(a.pathPrefix + "/run.sh"));
        adapters.unshift(new CpeeMergeAdapter());
        return new MergeAlgorithmEvaluation(adapters);
    }

    evalAll(caseDir = TestConfig.MERGE_CASES_DIR) {
        console.log("Using " + caseDir + " to evaluate merge algorithms");

        const resultsPerAdapter = new Map();
        const resultsPerTest = new Map();
        for (const adapter of this.adapters) {
            resultsPerAdapter.set(adapter, []);
        }

        const parser = new Preprocessor();
        fs.readdirSync(caseDir).forEach((dir) => {
            let base;
            let branch1;
            let branch2;
            let expected = [];
            let accepted = [];

            fs.readdirSync(caseDir + "/" + dir).forEach((file) => {
                    const content = fs.readFileSync(caseDir + "/" + dir + "/" + file).toString();
                    if (file === "base.xml") {
                        base = parser.parseWithMetadata(content);
                    } else if (file === "1.xml") {
                        branch1 = parser.parseWithMetadata(content);
                    } else if (file === "2.xml") {
                        branch2 = parser.parseWithMetadata(content);
                    } else if (file.startsWith("expected")) {
                        expected.push(parser.parseWithMetadata(content));
                    } else if (file.startsWith("accepted")) {
                        accepted.push(parser.parseWithMetadata(content));
                    }
                }
            );
            if (base == null || branch1 == null || branch2 == null || expected.length === 0) {
                //test case is incomplete => skip
                console.log("Skip case " + dir + " due to missing files");
                return;
            }

            resultsPerTest.set(dir, []);
            for (const adapter of this.adapters) {
                console.log("Running merge case " + dir + " for " + adapter.displayName);

                const result = adapter.evalCase(dir, base, branch1, branch2, expected, accepted)
                resultsPerAdapter.get(adapter).push(result);
                resultsPerTest.get(dir).push(result);
            }

        });

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
        console.log(MarkDownFactory.tabularize(aggregateResults));
    }


}

