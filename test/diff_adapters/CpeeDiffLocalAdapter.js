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
import {HashExtractor} from "../../src/extract/HashExtractor.js";
import {DiffTestResult} from "../result/DiffTestResult.js";
import fs from "fs";
import {Logger} from "../../util/Logger.js";
import {ActualDiff} from "../actual/ActualDiff.js";
import {MatchPipeline} from "../../src/match/MatchPipeline.js";
import {Config} from "../../src/Config.js";

export class CpeeDiffLocalAdapter extends DiffAdapter {

    constructor() {
        super("", TestConfig.DIFFS.CPEEDIFF.displayName + "_LOCAL");
    }

    _run(oldTree, newTree) {
        let time = new Date().getTime();
        Config.MATCH_MODE = Config.MATCH_MODES.QUALITY;
        const delta = new CpeeDiff(MatchPipeline.fromMode()).diff(oldTree, newTree);
        time = new Date().getTime() - time;
        return {
            output: delta,
            runtime: time
        };
    }

    _parseOutput(output) {
        let updates = 0;
        let insertions = 0;
        let moves = 0;
        let deletions = 0;

        //parse output
        for (const change of output) {
            switch (change.type) {
                case Dsl.CHANGE_MODEL.INSERTION.label:
                    insertions++;
                    break;
                case Dsl.CHANGE_MODEL.DELETION.label:
                    deletions++;
                    break;
                case Dsl.CHANGE_MODEL.MOVE_TO.label:
                    moves++;
                    break;
                case Dsl.CHANGE_MODEL.UPDATE.label:
                    updates++;
                    break;
            }
        }
        return [insertions, moves, updates, deletions, output.cost];
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
        return testCase.complete(this.displayName, exec.runtime, new ActualDiff(XmlFactory.serialize(exec.output), ...counters), TestConfig.VERDICTS.OK);
    }
}


