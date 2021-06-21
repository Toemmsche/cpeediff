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

const xmldom = require("xmldom");
const vkbeautify = require("vkbeautify");
const {CpeeNodeFactory} = require("../factory/CpeeNodeFactory");
const {CpeeNode} = require("../cpee/CpeeNode");
const {Dsl} = require("../Dsl");

class Change {

    changeType;
    oldPath;
    newPath;
    newData;

    constructor(changeType, oldPath = null, newPath = null, newData = null) {
        this.changeType = changeType;
        this.oldPath = oldPath;
        this.newPath = newPath;
        this.newData = newData;
    }

    toString() {
        return this.changeType + " " +
            (this.oldPath !== null ? this.oldPath + " " : "") +
            (this.oldPath !== null && this.newPath !== null  ? "-> " : "") +
            (this.newPath !== null ? this.newPath + " " : "") +
            (this.newData !== null ? this.newData + " " : "");
    }
}

exports.Change = Change;