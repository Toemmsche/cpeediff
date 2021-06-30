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
import {Preprocessor} from "../../src/parse/Preprocessor.js";
import * as fs from "fs";
import {AggregateMergeResult} from "./AggregateMatchResult.js";

export class MergeAlgorithmEvaluation {

    adapters;

    constructor(adapters = []) {
        this.adapters = adapters;
    }

    evalAll(caseDir = TestConfig.MERGE_CASES_DIR) {
        console.log("Using " + caseDir + " to evaluate merge algorithms");

        const results = new Map();
        for (const adapter of this.adapters) {
            results.set(adapter, []);
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
                return;
            }

            for (const adapter of this.adapters) {
                results.get(adapter).push(adapter.evalCase(dir, base, branch1, branch2, expected, accepted));
            }

        });

        for(const [adapter, resultsList] of results) {
            let okCount = 0;
            let acceptableCount = 0;
            let wrongAnswerCount = 0;
            let runtimeErrorCount = 0;
            for(const result of resultsList) {
                if(result.verdict === TestConfig.VERDICTS.OK) {
                    okCount++;
                } else if(result.verdict === TestConfig.VERDICTS.ACCEPTABLE) {
                    acceptableCount++;
                } else if(result.verdict === TestConfig.VERDICTS.WRONG_ANSWER) {
                    wrongAnswerCount++;
                } else if(result.verdict === TestConfig.VERDICTS.RUNTIME_ERROR) {
                    runtimeErrorCount++;
                }
            }

            const aggregateResult = new AggregateMergeResult(adapter.constructor.name, okCount, acceptableCount, wrongAnswerCount, runtimeErrorCount);

            console.log(aggregateResult);
        }
    }


}

