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

const {Serializable} = require("../utils/Serializable");

class Change extends Serializable {

    static CHANGE_TYPES = {
        INSERTION: "Insertion",
        DELETION: "Deletion",
        MOVE: "Move",
        UPDATE: "Update"
    }

    changeType;
    oldPath;
    oldNode;
    newPath;
    newNode;

    constructor(changeType, oldPath = null, oldNode = null, newPath = null, newNode = null) {
        super();
        this.changeType = changeType;
        this.oldPath = oldPath;
        this.newPath = newPath;
        this.oldNode = oldNode;
        this.newNode = newNode;
    }

    static insert(newPath, newNode) {
        return new Change(this.CHANGE_TYPES.INSERTION, null, null, newPath, newNode);
    }
    static delete(oldPath) {
        return new Change(this.CHANGE_TYPES.DELETION, oldPath, null,null, null);
    }
    static move(oldPath, newPath) {
        return new Change(this.CHANGE_TYPES.MOVE, oldPath, null, newPath);
    }
    static update(oldPath, oldNode, newNode) {
        return new Change(this.CHANGE_TYPES.UPDATE, oldPath, oldNode, null, newNode);
    }

    toString() {
        return this.changeType + " " +
            (this.oldPath !== null ? this.oldPath + " " : "") +
            (this.oldNode !== null ? this.oldNode + " " : "") +
            (this.newPath !== null ? this.newPath + " " : "") +
            (this.newNode !== null ? this.newNode + " " : "");
    }

    /**
     * @override
     * @returns {string}
     */
    convertToJson() {
        function replacer(key, value) {
            if(value == "") { //lossy comparison matches null
                return undefined;
            }
            return value;
        }
        return JSON.stringify(this, replacer);
    }
}

exports.Change = Change;