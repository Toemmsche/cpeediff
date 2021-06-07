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

const {Dsl} = require("../Dsl");
const {Serializable} = require("../utils/Serializable");

class Change extends Serializable {

    changeType;
    oldPath;
    oldData;
    newPath;
    newData;

    constructor(changeType, oldPath = null, oldData = null, newPath = null, newData = null) {
        super();
        this.changeType = changeType;
        this.oldPath = oldPath;
        this.newPath = newPath;
        this.oldData = oldData;
        this.newData = newData;
    }

    static insert(newPath, newData, subtree = false) {
        return new Change(subtree ? Dsl.CHANGE_TYPES.SUBTREE_INSERTION : Dsl.CHANGE_TYPES.INSERTION, null, null, newPath, newData);
    }

    static delete(oldPath, subtree = false) {

        return new Change(subtree ? Dsl.CHANGE_TYPES.SUBTREE_DELETION : Dsl.CHANGE_TYPES.DELETION, oldPath, null, null, null);
    }

    static move(oldPath, newPath) {
        return new Change(Dsl.CHANGE_TYPES.MOVE_TO, oldPath, null, newPath);
    }

    static update(oldPath, oldData, newData) {
        return new Change(Dsl.CHANGE_TYPES.UPDATE, oldPath, oldData, null, newData);
    }

    static parseFromJson(str) {
        return Object.assign(new Change(), JSON.parse(str));
    }

    toString() {
        return this.changeType + " " +
            (this.oldPath !== null ? this.oldPath + " " : "") +
            (this.oldData !== null ? this.oldData + " " : "") +
            ((this.oldPath !== null || this.oldData !== null) && (this.newPath !== null || this.newData !== null) ? "-> " : "") +
            (this.newPath !== null ? this.newPath + " " : "") +
            (this.newData !== null ? this.newData + " " : "");
    }

    /**
     * @override
     * @returns {string}
     */
    convertToJson() {
        function replacer(key, value) {
            if (value == "") { //lossy comparison matches null
                return undefined;
            }
            return value;
        }

        return JSON.stringify(this, replacer);
    }
}

exports.Change = Change;