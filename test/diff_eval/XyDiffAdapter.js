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

import {TestConfig} from "../TestConfig.js";
import {DiffTestResult} from "./DiffTestResult.js";
import xmldom from "xmldom";
import {AbstractDiffAdapter} from "./AbstractDiffAdapter.js";
import {DomHelper} from "../../DomHelper.js";

export class XyDiffAdapter extends AbstractDiffAdapter {

    constructor() {
        super(TestConfig.DIFFS.XYDIFF.path, TestConfig.DIFFS.XYDIFF.displayName);
    }

    _parseOutput(output) {
        let updateCounter = 0;
        let insertionCounter = 0;
        let moveCounter = 0;
        let deletionCounter = 0;

        //parse output
        //enclosing tag for diff is "unit_delta"
        let delta = DomHelper.firstChildElement(new xmldom.DOMParser().parseFromString(output, "text/xml"), "unit_delta");
        //changes are further enclosed in a "t" tag
        delta = DomHelper.firstChildElement(delta, "t");
        for (let i = 0; i < delta.childNodes.length; i++) {
            const childNode = delta.childNodes.item(i);
            if (childNode.localName != null) {
                //edit operations are shortened to a single letter
                switch (childNode.localName) {
                    case "i":
                        if(childNode.hasAttribute("move") && childNode.getAttribute("move") === "yes") {
                            moveCounter++;
                        } else {
                            insertionCounter++;
                        }
                        break;
                    case "d":
                        if(childNode.hasAttribute("move") && childNode.getAttribute("move") === "yes") {
                            moveCounter++;
                        } else {
                            deletionCounter++;
                        }
                        break;
                    default:
                        /*
                        XyDiff represents changes on attributes (which are updates in our change model)
                        by prefixing the change operation with the letter "a".
                         */
                        updateCounter++;
                        break;
                }
            }
        }
        //all moves are detected twice
        return [insertionCounter, moveCounter / 2, updateCounter, deletionCounter];
    }

    evalCase(info, oldTree, newTree) {
        let exec;
        try {
            exec = this._run(oldTree, newTree);
        } catch (e) {
            //check if timeout or runtime error
            if (e.code === "ETIMEDOUT") {
                console.log(this.displayName + " timed out for " + info.name);
                return DiffTestResult.timeout(info, this.displayName);
            } else {
                console.log(this.displayName + " crashed for " + info.name + ": " + e.toString());
                return DiffTestResult.fail(info, this.displayName)
            }
        }
        const counters = this._parseOutput(exec.output);
        const changesFound = counters.reduce((a, b) => a + b, 0);
        return new DiffTestResult(info, this.displayName, exec.runtime, changesFound, ...counters, exec.output.length)
    }
}


