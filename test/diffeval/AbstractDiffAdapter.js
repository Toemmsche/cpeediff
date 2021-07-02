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
import {execFileSync} from "child_process";

export class AbstractDiffAdapter {

    pathPrefix;
    displayName;

    constructor(pathPrefix, displayName) {
        this.pathPrefix = pathPrefix;
        this.displayName = displayName;
    }

    _run(oldTree, newTree) {
        const oldTreeString = XmlFactory.serialize(oldTree);
        const newTreeString = XmlFactory.serialize(newTree);

        const oldFilePath = this.pathPrefix + "/old.xml";
        const newFilePath = this.pathPrefix + "/new.xml";

        fs.writeFileSync(oldFilePath, oldTreeString);
        fs.writeFileSync(newFilePath, newTreeString);

        let time = new Date().getTime();
        return {
            output:execFileSync(this.pathPrefix + "/run.sh", [oldFilePath, newFilePath], TestConfig.EXECUTION_OPTIONS).toString(),
            runtime: new Date().getTime() - time
        }

    }

    _parseOutput(output) {
        let updateCounter = 0;
        let insertionCounter = 0;
        let moveCounter = 0;
        let deletionCounter = 0;

        //parse output
        let delta = new xmldom.DOMParser().parseFromString(output, "text/xml").firstChild;
        //look for delta node that encloses the diff
        while (delta.localName !== "delta") {
            delta = delta.nextSibling;
        }
        for (let i = 0; i < delta.childNodes.length; i++) {
            const childNode = delta.childNodes.item(i);
            if (childNode.localName != null) {
                switch (childNode.localName) {
                    case "move":
                        moveCounter++;
                        break;
                    case "insert":
                        insertionCounter++;
                        break;
                    case "remove":
                        deletionCounter++;
                        break;
                    case "update":
                        updateCounter++;
                        break;
                }
            }
        }
        return [insertionCounter, moveCounter, updateCounter, deletionCounter];
    }

    evalCase(info, oldTree, newTree) {
        let exec;
        try {
            exec = this._run(oldTree, newTree);
        } catch (e) {
            //check if timeout or runtime error
            if (e.code === "ETIMEDOUT") {
                return DiffTestResult.timeout(info, this.displayName);
            } else {
                return DiffTestResult.fail(info, this.displayName)
            }
        }
        const counters = this._parseOutput(exec.output);
        const changesFound = counters.reduce((a, b) => a + b, 0);
        return new DiffTestResult(info, this.displayName, exec.runtime, changesFound, ...counters, exec.output.length)
    }
}


