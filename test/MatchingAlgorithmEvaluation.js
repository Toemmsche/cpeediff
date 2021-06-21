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
const {Preprocessor} = require("../prototypes/parse/Preprocessor");
const {TestConfig} = require("./TestConfig");
const {ExpectedMatch} = require("./ExpectedMatch");
const {IdExtractor} = require("../prototypes/extract/IdExtractor");

class MatchingAlgorithmEvaluation {

    matchingAlgorithm;
    comparator;

    constructor(matchingAlgorithm, comparator) {
        this.matchingAlgorithm = matchingAlgorithm;
        this.comparator = comparator;
    }

    runAll() {
        console.log("Running all tests for " + this.matchingAlgorithm.constructor.name + " in combination with " + this.comparator.constructor.name);
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

            try {
                this.runCase(oldTree, newTree, expected);
                successCounter++;
            } catch (e) {
                if(e instanceof  assert.AssertionError) {
                    console.log("Bad answer for test: " + dir);
                } else {
                    console.log("Failed on test: " + dir);
                }
            } finally {
                totalCounter++;
            }

        });

        console.log("Passed " + successCounter + " out of " + totalCounter + " tests");
    }

    runCase(oldTree, newTree, expected) {
        //match base and changed
        let matching;
        const oldToNewIdMap = new Map();
        const newToOldIdMap = new Map();

        matching = this.matchingAlgorithm.match(oldTree, newTree);

        //extract IDs of matched nodes
        const idExtractor = new IdExtractor();
        for (const [oldNode, newNode] of matching.oldToNewMap) {
            oldToNewIdMap.set(idExtractor.get(oldNode), idExtractor.get(newNode));
        }
        for (const [newNode, oldNode] of matching.newToOldMap) {
            newToOldIdMap.set(idExtractor.get(newNode), idExtractor.get(oldNode));
        }

        //verify that matching meets the expected results
        for (const matchPair of expected.matchPairs) {
            const oldId = matchPair[0];
            const newId = matchPair[1];
            assert.ok(oldToNewIdMap.has(oldId));
            assert.strictEqual(oldToNewIdMap.get(oldId), newId);
        }

        for (const notMatchPair of expected.notMatchPairs) {
            const oldId = notMatchPair[0];
            const newId = notMatchPair[1];
            if (oldToNewIdMap.has(oldId)) {
                assert.notStrictEqual(oldToNewIdMap.get(oldId), newId);
            }
        }

        for (const oldId of expected.oldMatched) {
            assert.ok(oldToNewIdMap.has(oldId));
        }

        for (const newId of expected.newMatched) {
            assert.ok(newToOldIdMap.has(newId));
        }

        for (const oldId of expected.notOldMatched) {
            assert.ok(!oldToNewIdMap.has(oldId));
        }

        for (const newId of expected.notNewMatched) {
            assert.ok(!newToOldIdMap.has(newId));
        }

    }

}

exports.MatchingAlgorithmEvaluation = MatchingAlgorithmEvaluation;