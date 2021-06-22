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

    evalAll() {
        const parser = new Preprocessor();
        let successCounter = 0;
        let totalCounter = 0;
        fs.readdirSync(TestConfig.MATCH_CASES_DIR).forEach((dir) => {
            let oldTree;
            let newTree;
            let expected;

            fs.readdirSync(TestConfig.MATCH_CASES_DIR + "/" + dir).forEach((file) => {

                    const content = fs.readFileSync(TestConfig.MATCH_CASES_DIR + "/" + dir + "/" + file).toString();
                    if (file === "new.xml") {
                        newTree = parser.parseWithMetadata(content);
                    } else if (file === "old.xml") {
                        oldTree = parser.parseWithMetadata(content);
                    } else if (file === "expected.json") {
                        expected = Object.assign(new ExpectedMatch(), JSON.parse(content));
                    }
                }
            );

            new OurAdapter().evalCase(oldTree, newTree, expected);

        });

        console.log("Passed " + successCounter + " out of " + totalCounter + " tests");
    }



}

exports.MatchingAlgorithmEvaluation = MatchingAlgorithmEvaluation;