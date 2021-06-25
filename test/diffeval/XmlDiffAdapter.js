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
const {TestConfig} = require("../TestConfig");
const {XmlFactory} = require("../../prototypes/factory/XmlFactory");
const {DiffTestResult} = require("./DiffTestResult");
const {Config} = require("../../prototypes/Config");
const {Dsl} = require("../../prototypes/Dsl");
const {MatchDiff} = require("../../prototypes/diff/MatchDiff");

class XmlDiffAdapter {

    evalCase(info, oldTree, newTree) {
        const oldTreeString = XmlFactory.serialize(oldTree);
        const newTreeString = XmlFactory.serialize(newTree);

        const oldFilePath = TestConfig.XMLDIFF_PATH + "/old.xml";
        const newFilePath = TestConfig.XMLDIFF_PATH + "/new.xml";

        fs.writeFileSync(oldFilePath, oldTreeString);
        fs.writeFileSync(newFilePath, newTreeString);

        let output;
        let time = new Date().getTime();
        try {
            output = execSync("xmldiff " + oldFilePath + " " + newFilePath).toString();
        } catch (e) {
            //something went wrong, not test result available
            return null;
        }
        time = new Date().getTime() - time;

        let updateCounter = 0;
        let insertionCounter = 0;
        let moveCounter = 0;
        let deletionCounter = 0;

        //parse output
        for(const line of output.split("\n")) {
            if(line !== "") {
                if( !line.startsWith("[")) {
                    throw new Error("unknown output");
                }

                //xmldiff output pattern: [{changeType}, {path} {description of the change}]
                const changeType = line.split(",")[0].slice(1);
                switch(changeType) {
                    case "delete": deletionCounter++; break;
                    case "insert": insertionCounter++; break;
                    case "move": moveCounter++; break;
                    default: updateCounter++; break;
                }
            }
        }

        const changesFound = updateCounter + deletionCounter + insertionCounter + moveCounter;
        return new DiffTestResult(info, time, changesFound, insertionCounter, moveCounter, updateCounter,deletionCounter, null )
    }
}

exports.XmlDiffAdapter = XmlDiffAdapter;
