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
    toString() {
        return this.changes.join("\n");
    }
}

class Change {
    static typeEnum = {
        INSERTION:1,
        DELETION:2,
        MOVE:3,
        RELABEL:4,
        COPY:5
    }
    type;

    //semantic depends on type
    sourceNode;
    targetNode;

    constructor(type, sourceNode, targetNode) {
        this.sourceNode = sourceNode;
        this.targetNode = targetNode;
        this.type = type;
    }

    toString() {
        let color;
        let action;
        let conjunction;

        switch (this.type) {
            case Change.typeEnum.INSERTION:
                color = MatchPatch.green; action = "INSERT"; conjunction = "at"; break;
            case Change.typeEnum.DELETION:
                color = MatchPatch.red; action = "DELETE"; conjunction = "from";break;
            case Change.typeEnum.MOVE:
                color = MatchPatch.yellow; action = "MOVE"; conjunction = "to";break;
            case Change.typeEnum.RELABEL:
                color = MatchPatch.cyan; action = "RELABEL"; conjunction = "to";break;
            case Change.typeEnum.COPY:
                color = MatchPatch.blue; action = "COPY"; conjunction = "to";break;
            default: color = MatchPatch.white; action = "NOOP"; conjunction = "";break;
        }

        return `${color}${action} ${this.sourceNode.toString()} ${conjunction} ${this.targetNode.toString()}`;
    }

}
exports.MatchPatch = MatchPatch;
exports.Change = Change;