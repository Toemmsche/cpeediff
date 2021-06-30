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
import xmldom from "xmldom";
import {execSync} from "child_process";

export class DeltaJsAdapter {

    evalCase(info, oldTree, newTree) {
        const oldTreeString = XmlFactory.serialize(oldTree);
        const newTreeString = XmlFactory.serialize(newTree);

        const oldFilePath = TestConfig.DIFFS.DELTAJS.path + "/old.xml";
        const newFilePath = TestConfig.DIFFS.DELTAJS.path + "/new.xml";

        fs.writeFileSync(oldFilePath, oldTreeString);
        fs.writeFileSync(newFilePath, newTreeString);

        let output;
        let time = new Date().getTime();
        try {
            output = execSync(TestConfig.DIFFS.DELTAJS.path + "/run.sh " + oldFilePath + " " + newFilePath).toString();
        } catch (e) {
            //something went wrong...
            return DiffTestResult.fail(info, TestConfig.DIFFS.DELTAJS.displayName);
        }
        time = new Date().getTime() - time;

        let updateCounter = 0;
        let insertionCounter = 0;
        let moveCounter = 0;
        let deletionCounter = 0;

        //parse output
        let delta = new xmldom.DOMParser().parseFromString(output, "text/xml").firstChild;
        //look for delta node that encloses the diff
        while(delta.localName !== "delta") {
            delta = delta.nextSibling;
        }
        for (let i = 0; i < delta.childNodes.length; i++) {
            const node = delta.childNodes.item(i);
            if(node.childNodes != null) {
                for (let j = 0; j < node.childNodes.length; j++) {
                    const childNode = node.childNodes.item(j);
                    if(childNode.localName != null) {
                        switch (childNode.localName) {
                            case "move": moveCounter++; break;
                            case "insert": insertionCounter++; break;
                            case "remove": deletionCounter++; break;
                            case "update": updateCounter++; break;
                        }
                    }
                }
            }
        }

        const changesFound = updateCounter + deletionCounter + insertionCounter + moveCounter;
        return new DiffTestResult(info, TestConfig.DIFFS.DELTAJS.displayName, time, changesFound, insertionCounter, moveCounter, updateCounter, deletionCounter, output.length)
    }

    static register(diffAdapters) {
        if(fs.existsSync(TestConfig.DIFFS.DELTAJS.path + "/run.sh")) {
            diffAdapters.push(new DeltaJsAdapter());
        }
    }
}


