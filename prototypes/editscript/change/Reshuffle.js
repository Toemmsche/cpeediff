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

const {CPEENode} = require("../../CPEE/CPEENode");
const {AbstractChange} = require("./AbstractChange");

class Reshuffle extends AbstractChange {

    oldIndex;
    newIndex;

    constructor(shuffledNode, oldIndex, newIndex) {
        super(shuffledNode);
        this.oldIndex = oldIndex;
        this.newIndex = newIndex;
    }

    toString() {
        return "Reshuffle " + this.targetPath+
            " from index " + this.oldIndex +
            " to index " + this.newIndex;
    }

    convertToJson() {
        return {
            changeType: "Reshuffle",
            value: JSON.stringify(this)
        }
    }
}

exports.Reshuffle = Reshuffle;