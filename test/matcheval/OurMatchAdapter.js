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
const {Config} = require("../../src/Config");
const {SizeExtractor} = require("../../src/extract/SizeExtractor");
const {TestConfig} = require("../TestConfig");
const {MatchTestResult} = require("./MatchTestResult");
const {ChawatheMatching} = require("../../src/matching/ChawatheMatch");
const {IdExtractor} = require("../../src/extract/IdExtractor");

class OurMatchAdapter {

    evalCase(name, oldTree, newTree, expected) {

        //get max tree size
        const sizeExtractor = new SizeExtractor();
        const treeSize = sizeExtractor.get(newTree.root);

        //match base and changed
        let matching;
        let verdict = TestConfig.VERDICTS.OK;

        try {
            matching = new ChawatheMatching().match(oldTree, newTree);
        } catch (e) {
            console.log("Test " + name + " failed for " + OurMatchAdapter.constructor.name + ":" + e.toString());
            verdict = TestConfig.VERDICTS.RUNTIME_ERROR;
        }

        if (verdict === TestConfig.VERDICTS.OK) {
            try {
                this._verifyResult(matching, expected)
            } catch (e) {
                console.log("Test " + name + " failed for " + OurMatchAdapter.constructor.name + ":" + e.toString());
                verdict = TestConfig.VERDICTS.WRONG_ANSWER;
            }
        }


        return new MatchTestResult(name, "OurMatchingAlgorithm", verdict)

    }

    _verifyResult(matching, expected) {
        const oldToNewIdMap = new Map();
        const newToOldIdMap = new Map();

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
            assert.ok(oldToNewIdMap.has(oldId), "old node " + oldId + " is not matched");
            assert.strictEqual(oldToNewIdMap.get(oldId), newId, "old node " + oldId + " is matched with " + oldToNewIdMap.get(oldId) + " instead of " + newId);
        }

        for (const notMatchPair of expected.notMatchPairs) {
            const oldId = notMatchPair[0];
            const newId = notMatchPair[1];
            if (oldToNewIdMap.has(oldId)) {
                assert.notStrictEqual(oldToNewIdMap.get(oldId), newId, "old node " + oldId + " is wrongfully matched with " + newId);
            }
        }

        for (const oldId of expected.oldMatched) {
            assert.ok(oldToNewIdMap.has(oldId), "old node " + oldId + " is not matched");
        }

        for (const newId of expected.newMatched) {
            assert.ok(newToOldIdMap.has(newId), "mew node " + newId + " is not matched");
        }

        for (const oldId of expected.notOldMatched) {
            assert.ok(!oldToNewIdMap.has(oldId), "old node " + oldId + " is wrongfully matched");
        }

        for (const newId of expected.notNewMatched) {
            assert.ok(!newToOldIdMap.has(newId), "mew node " + newId + " is wrongfully matched");
        }
    }
}

exports.OurMatchAdapter = OurMatchAdapter;
