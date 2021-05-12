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

class OperationEditScript extends AbstractEditScript {

    constructor() {
        super();

    }
    /**
     * @override
     * @return {String} Color-coded string representation of this patch
     */
    toString(displayType = "path") {
        return this.changes.join("\n");
    }

    compress() {
    }
}

class Change {
    static typeEnum = {
        INSERTION: 1,
        DELETION: 2,
        MOVE: 3,
        RELABEL: 4,
        COPY: 5,
        SUBTREE_INSERTION: 6,
        SUBTREE_DELETION: 7,
        RESHUFFLE: 8
    }
    type;

    //semantic depends on type
    sourcePath;
    targetPath;
    sourceNode;
    targetNode;
    modifiedIndex;

    constructor(type, sourceNode, targetNode, modifiedIndex) {
        this.sourcePath = sourceNode.toString("path");
        this.targetPath = targetNode.toString("path");
        this.sourceNode = sourceNode;
        this.targetNode = targetNode;
        this.type = type;
        this.modifiedIndex = modifiedIndex;

        //TODO tidy and support multiple change types and preserver deleted nodes
        if(this.sourceNode.changeType === undefined) {
            this.sourceNode.changeType = type;
        }
    }

    toString(displayType) {
        let color;
        let action;
        let conjunction;

        switch (this.type) {
            case Change.typeEnum.INSERTION:
                color = AbstractEditScript.green;
                action = "INSERT";
                conjunction = "at";
                break;
            case Change.typeEnum.DELETION:
                color = AbstractEditScript.red;
                action = "DELETE";
                conjunction = "from";
                break;
            case Change.typeEnum.MOVE:
                color = AbstractEditScript.yellow;
                action = "MOVE";
                conjunction = "to";
                break;
            case Change.typeEnum.RELABEL:
                color = AbstractEditScript.cyan;
                action = "RELABEL";
                conjunction = "to";
                break;
            case Change.typeEnum.COPY:
                color = AbstractEditScript.blue;
                action = "COPY";
                conjunction = "to";
                break;
            case Change.typeEnum.SUBTREE_INSERTION:
                color = AbstractEditScript.green;
                action = "INSERT SUBTREE";
                conjunction = "at";
                break;
            case Change.typeEnum.SUBTREE_DELETION:
                color = AbstractEditScript.red;
                action = "DELETE SUBTREE";
                conjunction = "from";
                break;
            case Change.typeEnum.RESHUFFLE:
                color = AbstractEditScript.cyan;
                action = "RESHUFFLE ";
                conjunction = "to";
                break;
            default:
                color = AbstractEditScript.white;
                action = "NOOP";
                conjunction = "";
                break;
        }

        return `${color}${action} (${this.sourcePath}) ${conjunction} (${this.targetPath}) -> ${this.modifiedIndex}`;
    }
}

exports.OperationEditScript = OperationEditScript;
exports.Change = Change;