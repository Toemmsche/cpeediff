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
const {OurAdapter} = require("./OurAdapter");
const {Preprocessor} = require("../../prototypes/parse/Preprocessor");
const {TestConfig} = require("../TestConfig");
const {ExpectedMatch} = require("./ExpectedMatch");
const {IdExtractor} = require("../../prototypes/extract/IdExtractor");

class MatchingAlgorithmEvaluation {

    adapters;

    constructor(adapters = []) {
        this.adapters = adapters;
    }

    evalAll(caseDir = TestConfig.MATCH_CASES_DIR) {
        console.log("Using " + caseDir);
        const results = new Map();
        for(const adapter of this.adapters) {
            results.set(adapter, []);
        }

        const parser = new Preprocessor();
        fs.readdirSync(caseDir).forEach((dir) => {
            let oldTree;
            let newTree;
            let expected;

            fs.readdirSync(caseDir + "/" + dir).forEach((file) => {
                    const content = fs.readFileSync(caseDir + "/" + dir + "/" + file).toString();
                    if (file === "new.xml") {
                        newTree = parser.parseWithMetadata(content);
                    } else if (file === "old.xml") {
                        oldTree = parser.parseWithMetadata(content);
                    } else if (file === "expected.json") {
                        expected = Object.assign(new ExpectedMatch(), JSON.parse(content));
                    }
                }
            );
            if(oldTree == null || newTree == null || expected == null) {
                //test case is incomplete => skip
                return;
            }

            for(const adapter of this.adapters) {
                results.get(adapter).push(adapter.evalCase(dir, oldTree, newTree, expected));
            }

        });

        //TODO aggregate metrics
        for(const [adapter, resultsList] of results) {
            console.log("results for " + adapter.constructor.name);
            let amountOk = 0;
            let total = 0;
            for(const result of resultsList) {
                total++;
                console.log(result);
                if(result.verdict === TestConfig.VERDICTS.OK) {
                    amountOk++;
                } else {
                    console.log(result.verdict + " on " + result.name);
                }
            }

            console.log("Passed " + amountOk + " out of " + total);
        }
    }



}

exports.MatchingAlgorithmEvaluation = MatchingAlgorithmEvaluation;