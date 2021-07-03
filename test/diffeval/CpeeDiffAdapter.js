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
import {DeltaTreeGenerator} from "../../src/patch/DeltaModelGenerator.js";
import {Dsl} from "../../src/Dsl.js";
import {XmlFactory} from "../../src/factory/XmlFactory.js";
import {AbstractDiffAdapter} from "./AbstractDiffAdapter.js";
import {TestConfig} from "../TestConfig.js";
import {EditScriptFactory} from "../../src/factory/EditScriptFactory.js";

export class CpeeDiffAdapter extends AbstractDiffAdapter {

    constructor() {
        super(TestConfig.DIFFS.CPEEDIFF.path, TestConfig.DIFFS.CPEEDIFF.displayName);
    }

    _run(oldTree, newTree) {
        //TODO child order hash
        Config.EXACT_EDIT_SCRIPT = true;
        let time = new Date().getTime();
        const delta = new CpeeDiff().diff(oldTree, newTree);
        time = new Date().getTime() - time;
        //verify the correctness of our diff by patching the original tree with it
        const deltaTree = new DeltaTreeGenerator().deltaTree(oldTree, delta);
        if (!deltaTree.deepEquals(newTree)) {
            throw new Error();
        }
        return {
            output: XmlFactory.serialize(delta),
            runtime: time
        };
    }

    _parseOutput(output) {
        let updateCounter = 0;
        let insertionCounter = 0;
        let moveCounter = 0;
        let deletionCounter = 0;

        //parse output
        let delta = EditScriptFactory.getEditScript(output);
        for (const change of delta.changes) {
            switch (change.changeType) {
                case Dsl.CHANGE_TYPES.INSERTION:
                case Dsl.CHANGE_TYPES.SUBTREE_INSERTION:
                    insertionCounter++;
                    break;
                case Dsl.CHANGE_TYPES.DELETION:
                case Dsl.CHANGE_TYPES.SUBTREE_DELETION:
                    deletionCounter++;
                    break;
                case Dsl.CHANGE_TYPES.MOVE_TO:
                    moveCounter++;
                    break;
                case Dsl.CHANGE_TYPES.UPDATE:
                    updateCounter++;
                    break;
            }
        }
        return [insertionCounter, moveCounter, updateCounter, deletionCounter];
    }
}


