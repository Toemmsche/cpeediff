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
import {Config} from "../../src/Config.js";
import {DeltaTreeGenerator} from "../../src/patch/DeltaTreeGenerator.js";
import {Dsl} from "../../src/Dsl.js";
import {XmlFactory} from "../../src/io/XmlFactory.js";
import {DiffAdapter} from "./DiffAdapter.js";
import {TestConfig} from "../TestConfig.js";
import {EditScriptFactory} from "../../src/diff/EditScriptFactory.js";
import {NodeFactory} from "../../src/tree/NodeFactory.js";
import {HashExtractor} from "../../src/extract/HashExtractor.js";
import fs from "fs";
import {execFileSync} from "child_process";
import {Logger} from "../../util/Logger.js";

export class CpeeDiffAdapter extends DiffAdapter {
    mode;

    constructor(mode = Config.MATCH_MODES.BALANCED) {
        super(TestConfig.DIFFS.CPEEDIFF.path, TestConfig.DIFFS.CPEEDIFF.displayName + "_" + mode);
        this.mode = mode;
    }

    _run(oldTree, newTree) {
        const oldTreeString = XmlFactory.serialize(oldTree);
        const newTreeString = XmlFactory.serialize(newTree);

        const oldFilePath = TestConfig.OLD_TREE_FILENAME;
        const newFilePath = TestConfig.NEW_TREE_FILENAME;

        fs.writeFileSync(oldFilePath, oldTreeString);
        fs.writeFileSync(newFilePath, newTreeString);

        let time = new Date().getTime();
        return {
            output: execFileSync("./main.js", ["diff", "--mode", this.mode, oldFilePath, newFilePath], TestConfig.EXECUTION_OPTIONS).toString(),
            runtime: new Date().getTime() - time
        }
    }

    _parseOutput(output) {
        let updates = 0;
        let insertions = 0;
        let moves = 0;
        let deletions = 0;

        //parse output
        let delta = EditScriptFactory.getEditScript(output);
        for (const change of delta) {
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
        return [insertions, moves, updates, deletions, delta.cost];
    }
}


