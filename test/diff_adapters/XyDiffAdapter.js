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
import xmldom from "xmldom";
import {DiffAdapter} from "./DiffAdapter.js";
import {DomHelper} from "../../util/DomHelper.js";


export class XyDiffAdapter extends DiffAdapter {

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
}


