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
const {IdExtractor} = require("../prototypes/extract/IdExtractor");
const {ChawatheMatching} = require("../prototypes/matching/ChawatheMatch");
const {ExpectedMatch} = require("./ExpectedMatch");
const {Preprocessor} = require("../prototypes/parse/Preprocessor");



const matchingAlgorithm = new ChawatheMatching();




describe("match cases", () => {

    const pathPrefix = "test/test_set/match_cases"
    fs.readdirSync(pathPrefix).forEach((dir) => {
        let oldTree;
        let newTree;
        let expected;

        fs.readdirSync(pathPrefix + "/" + dir).forEach((file) => {
                const parser = new Preprocessor();
                const content = fs.readFileSync(pathPrefix + "/" + dir + "/" + file).toString();
                if (file === "new.xml") {
                    newTree = parser.parseWithMetadata(content);
                } else if (file === "old.xml") {
                    oldTree = parser.parseWithMetadata(content);
                } else if (file === "expected.json") {
                    expected = Object.assign(new ExpectedMatch(), JSON.parse(content));
                }
            }
        );

        describe(dir, () => {
            //match base and changed
            let matching;
            const oldToNewIdMap = new Map();
            const newToOldIdMap = new Map();

            it("should not fail", () => {
                matching = matchingAlgorithm.match(oldTree, newTree);
                const idExtractor = new IdExtractor();

                for (const [oldNode, newNode] of matching.oldToNewMap) {
                    oldToNewIdMap.set(idExtractor.get(oldNode), idExtractor.get(newNode));
                }
                for (const [newNode, oldNode] of matching.newToOldMap) {
                    newToOldIdMap.set(idExtractor.get(newNode), idExtractor.get(oldNode));
                }
            });


            if (expected.matchPairs.length > 0) {
                //verify that matching meets the expected results
                it("should produce expected matchings", () => {
                    for (const matchPair of expected.matchPairs) {
                        const oldId = matchPair[0];
                        const newId = matchPair[1];
                        assert.ok(oldToNewIdMap.has(oldId));
                        assert.strictEqual(oldToNewIdMap.get(oldId), newId);
                    }
                });
            }

            if (expected.notMatchPairs.length > 0) {
                it("should NOT produce unwanted matchings", () => {
                    for (const notMatchPair of expected.notMatchPairs) {
                        const oldId = notMatchPair[0];
                        const newId = notMatchPair[1];
                        if (oldToNewIdMap.has(oldId)) {
                            assert.notStrictEqual(oldToNewIdMap.get(oldId), newId);
                        }
                    }
                });
            }

            if (expected.oldMatched.length > 0) {
                it("should match certain nodes from the old tree", () => {
                    for (const oldId of expected.oldMatched) {
                        assert.ok(oldToNewIdMap.has(oldId));
                    }
                });
            }

            if (expected.newMatched.length > 0) {
                it("should match certain nodes from the new tree", () => {
                    for (const newId of expected.newMatched) {
                        assert.ok(newToOldIdMap.has(newId));
                    }
                });
            }

            if (expected.notOldMatched.length > 0) {
                it("should NOT match certain nodes from the old tree", () => {
                    for (const oldId of expected.notOldMatched) {
                        assert.ok(!oldToNewIdMap.has(oldId));
                    }
                });
            }

            if (expected.notNewMatched.length > 0) {
                it("should NOT match certain nodes from the new tree", () => {
                    for (const newId of expected.notNewMatched) {
                        assert.ok(!newToOldIdMap.has(newId));
                    }
                });
            }
        })
    })
});
