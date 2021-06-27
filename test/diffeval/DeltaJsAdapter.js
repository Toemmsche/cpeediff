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

const execSync = require('child_process').execSync;
const assert = require("assert");
const fs = require("fs");
const xmldom = require("xmldom");
const {TestConfig} = require("../TestConfig");
const {XmlFactory} = require("../../src/factory/XmlFactory");
const {DiffTestResult} = require("./DiffTestResult");
const {Config} = require("../../src/Config");
const {Dsl} = require("../../src/Dsl");
const {MatchDiff} = require("../../src/diff/MatchDiff");

class DeltaJsAdapter {

    evalCase(info, oldTree, newTree) {
        const oldTreeString = XmlFactory.serialize(oldTree);
        const newTreeString = XmlFactory.serialize(newTree);

        const oldFilePath = TestConfig.DELTAJS_PATH + "/old.xml";
        const newFilePath = TestConfig.DELTAJS_PATH + "/new.xml";

        fs.writeFileSync(oldFilePath, oldTreeString);
        fs.writeFileSync(newFilePath, newTreeString);

        let output;
        let time = new Date().getTime();
        try {
            output = execSync(TestConfig.DELTAJS_PATH + "/run.sh " + oldFilePath + " " + newFilePath).toString();
        } catch (e) {
            //something went wrong...
            return null;
        }
        time = new Date().getTime() - time;

        let updateCounter = 0;
        let insertionCounter = 0;
        let moveCounter = 0;
        let deletionCounter = 0;

        //parse output
        //TODO

        const changesFound = updateCounter + deletionCounter + insertionCounter + moveCounter;
        return new DiffTestResult(info, "Delta.js", time, changesFound, insertionCounter, moveCounter, updateCounter, deletionCounter, output.length)
    }

    static register(diffAdapters) {
        if(fs.existsSync(TestConfig.DELTAJS_PATH + "/run.sh")) {
            diffAdapters.push(new DeltaJsAdapter());
        }
    }
}

exports.DeltaJsAdapter = DeltaJsAdapter;
