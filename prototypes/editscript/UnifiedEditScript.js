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


const {AbstractEditScript} = require("./AbstractEditScript");
const fs = require("fs");

class UnifiedEditScript {

    deltaTree;
    changes;

    constructor(oldModifiedModel) {
        //the old model is modified during edit script generation and will serve as basis for our delta tree
        this.deltaTree= oldModifiedModel;
        this.changes = [];
    }


    toString(displayType = "lines") {
        switch(displayType) {
            case "lines":
                return this.changes.map(c => c.toString()).join("\n");
        }
    }

    addChange(change) {
        this.changes.push(change);
    }

    writeToFile(path) {
        const asJson = JSON.stringify(this.changes);
        fs.writeFileSync(path, asJson);
    }
}

class UnifiedChange {

    static TYPE_ENUM = {
        INSERTION: "INSERTION",
        DELETION: "DELETION",
        MOVE: "MOVE",
        RELABEL: "RELABEL",
        COPY: "COPY",
        SUBTREE_INSERTION: "SUBTREE_INSERTION",
        SUBTREE_DELETION: "SUBTREE_DELETION",
        RESHUFFLE: "RESHUFFLE"
    }

    changeType;
    sourcePath;
    targetPath;
    payload;

    constructor(changeType, sourceNode, targetNode) {
        if(changeType !== undefined && sourceNode !== undefined && targetNode !== undefined) {
            this.sourcePath = sourceNode.toString("path-with-type-index");
            this.targetPath = targetNode.toString("path-with-type-index");
            this.changeType = changeType;
            //TODO payload

            //TODO tidy and support multiple change types and preserver deleted nodes
            if(sourceNode.changeType === undefined) {
                sourceNode.changeType = changeType;
            }
        }
    }

    toString(displayType) {
        let color;
        let conjunction;

        switch (this.changeType) {
            case UnifiedChange.TYPE_ENUM.INSERTION:
                color = AbstractEditScript.green;
                conjunction = "at";
                break;
            case UnifiedChange.TYPE_ENUM.DELETION:
                color = AbstractEditScript.red;
                conjunction = "from";
                break;
            case UnifiedChange.TYPE_ENUM.MOVE:
                color = AbstractEditScript.yellow
                conjunction = "to";
                break;
            case UnifiedChange.TYPE_ENUM.RELABEL:
                color = AbstractEditScript.cyan;
                conjunction = "to";
                break;
            case UnifiedChange.TYPE_ENUM.COPY:
                color = AbstractEditScript.blue;
                conjunction = "to";
                break;
            case UnifiedChange.TYPE_ENUM.SUBTREE_INSERTION:
                color = AbstractEditScript.green;
                conjunction = "at";
                break;
            case UnifiedChange.TYPE_ENUM.SUBTREE_DELETION:
                color = AbstractEditScript.red;
                conjunction = "from";
                break;
            case UnifiedChange.TYPE_ENUM.RESHUFFLE:
                color = AbstractEditScript.cyan;
                conjunction = "to";
                break;
            default:
                color = AbstractEditScript.white;
                conjunction = "";
                break;
        }

        return `${color}${this.changeType} ${this.sourcePath} ${conjunction} ${this.targetPath}`;
    }
}

exports.UnifiedEditScript = UnifiedEditScript;
exports.UnifiedChange = UnifiedChange;