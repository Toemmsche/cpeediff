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


const {AbstractPatch} = require("./AbstractPatch");

/**
 * Abstract super class for all patches.
 * @abstract
 */
class MatchPatch extends AbstractPatch {

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
        for (let i = 0; i < this.changes.length; i++) {

            const change = this.changes[i];
            if (change.type === Change.typeEnum.INSERTION || change.type === Change.typeEnum.COPY) {
                const arr = change.sourceNode.toPreOrderArray();
                //change type must remain the same
                for (let j = 1; j < arr.length; j++) {
                    if(i + j >= this.changes.length || this.changes[j].type !== change.type || !this.changes[i + j].sourceNode.nodeEquals(arr[j])) {
                        break;
                    }
                    if(j === arr.length - 1) {
                        //replace whole subarray with single subtree insertion
                        this.changes[i] = new Change(Change.typeEnum.SUBTREE_DELETION, change.sourceNode, change.targetNode, change.modifiedIndex);
                        this.changes.splice(i + 1, arr.length - 1);
                    }
                }
            }
        }
        //reverse
        //TODO doesnt work because child nodes are deleted from the tree
        this.changes.reverse();
        for (let i = 0; i < this.changes.length; i++) {
            const change = this.changes[i];
            if (change.type === Change.typeEnum.DELETION) {
                const arr = change.sourceNode.toPreOrderArray();
                //change type must remain the same
                for (let j = 1; j < arr.length; j++) {
                    if(i + j >= this.changes.length || this.changes[j].type !== change.type || !this.changes[i + j].sourceNode.nodeEquals(arr[j])) {
                        break;
                    }
                    if(j === arr.length - 1) {
                        //replace whole subarray with single subtree deletion
                        this.changes[i] = new Change(Change.typeEnum.SUBTREE_DELETION, change.sourceNode, change.targetNode, change.modifiedIndex);
                       this.changes.splice(i + 1, arr.length - 1);
                    }
                }
            }
        }
        //keep order consistent
        this.changes.reverse();
        console.log("kek");
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
        SUBTREE_DELETION: 7
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
    }

    toString(displayType) {
        let color;
        let action;
        let conjunction;

        switch (this.type) {
            case Change.typeEnum.INSERTION:
                color = MatchPatch.green;
                action = "INSERT";
                conjunction = "at";
                break;
            case Change.typeEnum.DELETION:
                color = MatchPatch.red;
                action = "DELETE";
                conjunction = "from";
                break;
            case Change.typeEnum.MOVE:
                color = MatchPatch.yellow;
                action = "MOVE";
                conjunction = "to";
                break;
            case Change.typeEnum.RELABEL:
                color = MatchPatch.cyan;
                action = "RELABEL";
                conjunction = "to";
                break;
            case Change.typeEnum.COPY:
                color = MatchPatch.blue;
                action = "COPY";
                conjunction = "to";
                break;
            case Change.typeEnum.SUBTREE_INSERTION:
                color = MatchPatch.green;
                action = "INSERT SUBTREE";
                conjunction = "at";
                break;
            case Change.typeEnum.SUBTREE_DELETION:
                color = MatchPatch.red;
                action = "DELETE SUBTREE";
                conjunction = "from";
                break;
            default:
                color = MatchPatch.white;
                action = "NOOP";
                conjunction = "";
                break;
        }

        return `${color}${action} ${this.sourcePath} ${conjunction} ${this.targetPath} -> ${this.modifiedIndex}`;
    }
}

exports.MatchPatch = MatchPatch;
exports.Change = Change;