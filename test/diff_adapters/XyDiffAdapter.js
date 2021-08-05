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
import {NodeFactory} from "../../src/tree/NodeFactory.js";


export class XyDiffAdapter extends DiffAdapter {

    constructor() {
        super(TestConfig.DIFFS.XYDIFF.path, TestConfig.DIFFS.XYDIFF.displayName);
    }

    _parseOutput(output) {
        let updates = 0;
        let insertions = 0;
        let moves = 0;
        let deletions = 0;

        let cost = 0;

        //parse output
        //enclosing tag for diff is "unit_delta"
        let delta = DomHelper.firstChildElement(new xmldom.DOMParser().parseFromString(output, "text/xml"), "unit_delta");
        //changes are further enclosed in a "t" tag
        delta = DomHelper.firstChildElement(delta, "t");
        DomHelper.forAllChildElements(delta, (xmlOperation) => {
            //edit operations are shortened to a single letter
            switch (xmlOperation.localName) {
                case "i":
                    if(xmlOperation.hasAttribute("move") && xmlOperation.getAttribute("move") === "yes") {
                        moves++;
                    } else {
                        insertions++;
                        //adjust cost
                        cost += NodeFactory.getNode(DomHelper.firstChildElement(xmlOperation)).size();
                    }
                    break;
                case "d":
                    if(xmlOperation.hasAttribute("move") && xmlOperation.getAttribute("move") === "yes") {
                        moves++;
                    } else {
                        deletions++;
                        //adjust cost
                        cost += NodeFactory.getNode(DomHelper.firstChildElement(xmlOperation)).size();
                    }
                    break;
                default:
                    /*
                    XyDiff represents changes on attributes (which are updates in our change model)
                    by prefixing the change operation with the letter "a".
                     */
                    updates++;
                    break;
            }
        })
        //every move is counted twice
        moves /= 2;
        //moves and updates have unit cost
        cost += moves + updates;
        //all moves are detected twice
        return [insertions, moves, updates, deletions, cost];
    }
}


