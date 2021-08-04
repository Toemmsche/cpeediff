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
import {DiffAdapter} from "./DiffAdapter.js";
import {DomHelper} from "../../util/DomHelper.js";
import xmldom from "xmldom";

export class XccAdapter extends DiffAdapter {

    constructor() {
        super(TestConfig.DIFFS.XCC.path, TestConfig.DIFFS.XCC.displayName);
    }

    _parseOutput(output) {
        let updateCounter = 0;
        let insertionCounter = 0;
        let moveCounter = 0;
        let deletionCounter = 0;

        //parse output
        const delta = DomHelper.firstChildElement(
            new xmldom.DOMParser().parseFromString(output, "text/xml"), "delta");
        const moveIds = new Set();
        for (let i = 0; i < delta.childNodes.length; i++) {
            const childNode = delta.childNodes.item(i);
            if (childNode.localName != null) {
                switch (childNode.localName) {
                    case "insert":
                        //moves are insertions and deletions with the same "id" attribute
                        if (childNode.hasAttribute("id") && !moveIds.has(childNode.getAttribute("id"))) {
                            moveCounter++;
                            moveIds.add(childNode.getAttribute("id"));
                        } else {
                            insertionCounter++;
                        }

                        break;
                    case "delete":
                        //moves are insertions and deletions with the same "id" attribute
                        if (childNode.hasAttribute("id") && !moveIds.has(childNode.getAttribute("id"))) {
                            moveCounter++;
                            moveIds.add(childNode.getAttribute("id"));
                        } else {
                            deletionCounter++;
                        }
                        break;
                    case "update":
                        updateCounter++;
                        break;
                }
            }
        }
        return [insertionCounter, moveCounter, updateCounter, deletionCounter];
    }
}


