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

import {CpeeDiff} from "../../src/diff/CpeeDiff.js";
import {DeltaTreeGenerator} from "../../src/patch/DeltaTreeGenerator.js";
import {Dsl} from "../../src/Dsl.js";
import {XmlFactory} from "../../src/io/XmlFactory.js";
import {DiffAdapter} from "./DiffAdapter.js";
import {TestConfig} from "../TestConfig.js";
import {HashExtractor} from "../../src/match/extract/HashExtractor.js";
import {DiffTestResult} from "../result/DiffTestResult.js";
import fs from "fs";
import {Logger} from "../../Logger.js";
import {ActualDiff} from "../actual/ActualDiff.js";

export class CpeeDiffLocalAdapter extends DiffAdapter {

    constructor() {
        super("", TestConfig.DIFFS.CPEEDIFF.displayName + "_LOCAL");
    }

    _run(oldTree, newTree) {
        fs.writeFileSync("newLOCAL.xml", XmlFactory.serialize(newTree));

        let time = new Date().getTime();
        const delta = new CpeeDiff().diff(oldTree, newTree);
        time = new Date().getTime() - time;
        //verify the correctness of our diff by patching the original tree with it
        const deltaTree = new DeltaTreeGenerator().deltaTree(oldTree, delta);
        const hashExtractor = new HashExtractor();
        if (hashExtractor.get(deltaTree) !== hashExtractor.get(newTree)) {
            throw new Error("Invalid edit script");
        }
        return {
            output: delta,
            runtime: time
        };
    }

    _parseOutput(output) {
        let updateCounter = 0;
        let insertionCounter = 0;
        let moveCounter = 0;
        let deletionCounter = 0;

        //parse output
        for (const change of output.changes) {
            switch (change.type) {
                case Dsl.OPERATION_TYPES.INSERTION.label:
                    insertionCounter++;
                    break;
                case Dsl.OPERATION_TYPES.DELETION.label:
                    deletionCounter++;
                    break;
                case Dsl.OPERATION_TYPES.MOVE_TO.label:
                    moveCounter++;
                    break;
                case Dsl.OPERATION_TYPES.UPDATE.label:
                    updateCounter++;
                    break;
            }
        }
        return [insertionCounter, moveCounter, updateCounter, deletionCounter];
    }

    evalCase(testCase) {
        let exec;
        try {
            exec = this._run(testCase.oldTree, testCase.newTree);
        } catch (e) {
            //check if timeout or runtime error
            if (e.code === "ETIMEDOUT") {
                Logger.info(this.displayName + " timed out for " + testCase.name, this);
                return testCase.complete(this.displayName, null, TestConfig.VERDICTS.TIMEOUT);
            } else {
                Logger.info(this.displayName + " crashed for " + testCase.name + ": " + e.toString(), this);
                return testCase.complete(this.displayName, null, TestConfig.VERDICTS.RUNTIME_ERROR)
            }
        }
        const counters = this._parseOutput(exec.output);
        //An OK verdict is emitted because the diff algorithm didnt fail
        return testCase.complete(this.displayName,  new ActualDiff(exec.output, exec.runtime, ...counters), TestConfig.VERDICTS.OK);
    }
}


