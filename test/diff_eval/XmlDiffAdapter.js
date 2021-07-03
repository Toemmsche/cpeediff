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

export class XmlDiffAdapter extends AbstractDiffAdapter {

    constructor() {
        super(TestConfig.DIFFS.XMLDIFF.path, TestConfig.DIFFS.XMLDIFF.displayName);
    }

    _parseOutput(output) {
        let updateCounter = 0;
        let insertionCounter = 0;
        let moveCounter = 0;
        let deletionCounter = 0;

        //parse output
        for (const line of output.split("\n")) {
            if (line !== "") {
                if (!line.startsWith("[")) {
                    throw new Error("unknown output");
                }

                //xmldiff output pattern: [{changeType}, {path} {description of the change}]
                const changeType = line.split(",")[0].slice(1);
                switch (changeType) {
                    case "delete":
                        deletionCounter++;
                        break;
                    case "insert":
                        insertionCounter++;
                        break;
                    case "move":
                        moveCounter++;
                        break;
                    default:
                        updateCounter++;
                        break;
                }
            }
        }
        return [insertionCounter, moveCounter, updateCounter, deletionCounter];
    }
}


