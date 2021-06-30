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

import {XmlFactory} from "../../src/factory/XmlFactory.js";
import {TestConfig} from "../TestConfig.js";
import fs from "fs";
import {DiffTestResult} from "./DiffTestResult.js";
import {execSync} from "child_process";

export class XmlDiffAdapter {

    evalCase(info, oldTree, newTree) {
        const oldTreeString = XmlFactory.serialize(oldTree);
        const newTreeString = XmlFactory.serialize(newTree);

        const oldFilePath = TestConfig.DIFFS.XMLDIFF.path + "/old.xml";
        const newFilePath = TestConfig.DIFFS.XMLDIFF.path + "/new.xml";

        fs.writeFileSync(oldFilePath, oldTreeString);
        fs.writeFileSync(newFilePath, newTreeString);

        let output;
        let time = new Date().getTime();
        try {
            output = execSync("xmldiff " + oldFilePath + " " + newFilePath).toString();
        } catch (e) {
            //something went wrong, no test result available
            return DiffTestResult.fail(info, TestConfig.DIFFS.XMLDIFF.displayName)
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
        return new DiffTestResult(info, TestConfig.DIFFS.XMLDIFF.displayName, time, changesFound, insertionCounter, moveCounter, updateCounter,deletionCounter, output.length)
    }

    static register(diffAdapters) {
        if(fs.existsSync(TestConfig.DIFFS.XMLDIFF.path)) {
            diffAdapters.push(new XmlDiffAdapter());
        }
    }
}


