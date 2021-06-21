/*
    Copyright 2021 Tom Papke

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a root of the License at

       http=//www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

const xmldom = require("xmldom");
const vkbeautify = require("vkbeautify");
const {Dsl} = require("../Dsl");
const {CpeeNode} = require("./CpeeNode");

class DeltaNode extends CpeeNode {

    //delta related information
    /**
     * @type String
     */
    changeType;
    updates;
    placeholders;

    //what original node it was mapped to (if any)
    baseNode;

    constructor(label, data = null, changeType = "NIL", baseNode = null ) {
        super(label, data);
        this.baseNode = baseNode;
        this.changeType = changeType;
        this.updates =  new Map();
        this.placeholders = [];
    }

    removeFromParent() {
        //adjust parent placeholders
        for (const placeholder of this._parent.placeholders) {
            if (placeholder._childIndex > this._childIndex) {
                placeholder._childIndex--;
            }
        }
        super.removeFromParent();
    }

    insertChild(index, node) {
        //adjust placeholders
        for (const placeholder of this.placeholders) {
            if (placeholder._childIndex >= index) {
                placeholder._childIndex++;
            }
        }
        super.insertChild(index, node);
    }

    isUpdate() {
        return this.updates.size > 0;
    }

    isMove() {
        return this.changeType === Dsl.CHANGE_TYPES.MOVE_TO;
    }

    isDeletion() {
        return this.changeType === Dsl.CHANGE_TYPES.DELETION || this.changeType === Dsl.CHANGE_TYPES.SUBTREE_DELETION;
    }

    isInsertion() {
        return this.changeType === Dsl.CHANGE_TYPES.INSERTION || this.changeType === Dsl.CHANGE_TYPES.SUBTREE_INSERTION;
    }

    isNil() {
        return this.changeType === Dsl.CHANGE_TYPES.NIL;
    }

    toString() {
        let res = this.label;
        res += " <" + this.changeType + (this.isUpdate() ? "-UPD" : "") + (this.baseNode !== null ? "_" + this.baseNode : "") + ">";
        if (this.isUpdate()) {
            for (const [key, change]  of this.updates) {
                res += " " + key + ": [" + change[0] + "] -> [" + change[1] + "]";
            }
        }
        return res;
    }

}

exports.DeltaNode = DeltaNode;