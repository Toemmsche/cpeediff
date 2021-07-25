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
import {AbstractDiffAdapter} from "./AbstractDiffAdapter.js";
import {TestConfig} from "../TestConfig.js";
import {HashExtractor} from "../../src/match/extract/HashExtractor.js";
import {DiffTestResult} from "./DiffTestResult.js";
import fs from "fs";
import {Logger} from "../../Logger.js";

export class CpeeDiffLocalAdapter extends AbstractDiffAdapter {

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
        Logger.stat("Cost of edit script: " + output.cost, this);
        return [insertionCounter, moveCounter, updateCounter, deletionCounter];
    }

    evalCase(info, oldTree, newTree) {
        let exec;
        try {
            exec = this._run(oldTree, newTree);
        } catch (e) {
            //check if timeout or runtime error
            if (e.code === "ETIMEDOUT") {
                Logger.info(this.displayName + " timed out for " + info.name, this);
                return DiffTestResult.timeout(info, this.displayName);
            } else {
                Logger.error(this.displayName + " crashed for " + info.name + ": " + e.toString(), this);
                return DiffTestResult.fail(info, this.displayName)
            }
        }
        const counters = this._parseOutput(exec.output);
        const changesFound = counters.reduce((a, b) => a + b, 0);
        return new DiffTestResult(info, this.displayName, exec.runtime, changesFound, ...counters, XmlFactory.serialize(exec.output).length)
    }
}


