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
import fs from "fs";
import {AbstractDiffAdapter} from "./AbstractDiffAdapter.js";
import xmldom from "xmldom";
import {DomHelper} from "../../DomHelper.js";

export class DeltaJsAdapter extends AbstractDiffAdapter{

    constructor() {
        super(TestConfig.DIFFS.DELTAJS.path, TestConfig.DIFFS.DELTAJS.displayName);
    }

    _parseOutput(output) {
        let updateCounter = 0;
        let insertionCounter = 0;
        let moveCounter = 0;
        let deletionCounter = 0;

        //parse output
        //diff is enclosed in delta
        let delta = DomHelper.firstChildElement(
            new xmldom.DOMParser().parseFromString(output, "text/xml"), "delta");

        for (let i = 0; i < delta.childNodes.length; i++) {
            const node = delta.childNodes.item(i);
            if (node.childNodes != null) {
                //operations are grouped in forests
                for (let j = 0; j < node.childNodes.length; j++) {
                    const childNode = node.childNodes.item(j);
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
            }
        }
        return [insertionCounter, moveCounter, updateCounter, deletionCounter];
    }
}


