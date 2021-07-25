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
import {IdExtractor} from "../../src/match/extract/IdExtractor.js";
import assert from "assert";
import {MatchTestResult} from "./MatchTestResult.js";
import {Logger} from "../../Logger.js";

export class AbstractMatchAdapter {

    pathPrefix;
    displayName;

    constructor(pathPrefix, displayName) {
        this.pathPrefix = pathPrefix;
        this.displayName = displayName;
    }

    _run(oldTree, newTree) {
        return null;
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
        for (const matchPair of expected.matches) {
            const oldId = matchPair[0];
            const newId = matchPair[1];
            assert.ok(oldToNewIdMap.has(oldId), "old node " + oldId + " is not matched");
            assert.strictEqual(oldToNewIdMap.get(oldId), newId, "old node " + oldId + " is matched with " + oldToNewIdMap.get(oldId) + " instead of " + newId);
        }

        for (const notMatchPair of expected.notMatches) {
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

    evalCase(name, oldTree, newTree, expected) {
        let matching;
        try {
            matching = this._run(oldTree, newTree);
        } catch (e) {
            //check if timeout or runtime error
            if (e.code === "ETIMEDOUT") {
               Logger.info(this.displayName + " timed out for " + name, this);
                return new MatchTestResult(name, this.displayName, TestConfig.VERDICTS.TIMEOUT);
            } else {
               Logger.info(this.displayName + " crashed on " + name + ": " + e.toString(), this);
                return new MatchTestResult(name, this.displayName, TestConfig.VERDICTS.RUNTIME_ERROR);
            }
        }
        try {
            this._verifyResult(matching, expected);
        } catch (e) {
            Logger.info(this.displayName + " gave wrong answer for " + name + ": " + e.toString(), this);
            return new MatchTestResult(name, this.displayName, TestConfig.VERDICTS.WRONG_ANSWER);
        }
        return new MatchTestResult(name, this.displayName, TestConfig.VERDICTS.OK);
    }
}


