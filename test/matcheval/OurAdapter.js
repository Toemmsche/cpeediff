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
const {TestConfig} = require("../TestConfig");
const {MatchTestResult} = require("./MatchTestResult");
const {ChawatheMatching} = require("../../prototypes/matching/ChawatheMatch");
const {IdExtractor} = require("../../prototypes/extract/IdExtractor");

class OurAdapter {

    evalCase(oldTree, newTree, expected) {
        //match base and changed
        let matching;


        let memUsage = process.memoryUsage().heapUsed;
        let runtime = new Date().getTime();
        let verdict = TestConfig.VERDICTS.OK;
        let nodesMatched;

        try {
            matching = new ChawatheMatching().match(oldTree, newTree);
            nodesMatched = matching.newToOldMap.size;
        } catch (e) {
            //TODO time limit
            console.log("Failed on test");
            verdict = TestConfig.VERDICTS.RUNTIME_ERROR;
        } finally {
            memUsage = process.memoryUsage().heapUsed - memUsage;
            runtime = new Date().getTime() - runtime;
        }

        if(verdict === TestConfig.VERDICTS.OK) {
            try {
                this._verifyResult(matching, expected)
            }catch (e) {
                console.log("Wrong answer for test");
                verdict = TestConfig.VERDICTS.WRONG_ANSWER;
            }
        }

        console.log("mem usage: " + memUsage);
        console.log("runtime: " + runtime);

        return new MatchTestResult(name, verdict, runtime, memUsage, nodesMatched)

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

exports.OurAdapter = OurAdapter;
