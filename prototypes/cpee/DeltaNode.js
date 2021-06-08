/*
    Copyright 2021 Tom Papke

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http=//www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

const {CpeeNode} = require("./CpeeNode");

class DeltaNode extends CpeeNode {

    //diff related information
    /**
     * @type String
     */
    changeType;
    updates;
    moveIndex;
    placeholders;

    constructor(label) {
        super(label);
        //NIL change type indicates no change
        this.changeType = "NIL";
        this.updates = [];
        this.placeholders = [];
        this.moveIndex = null;
    }

    static parseFromJson(str) {
        function reviver(key, value) {
            if (value instanceof Object) {
                //all maps are marked
                if (value.dataType !== undefined && value.dataType === "Map") {
                    return new Map(value.value);
                } else if (value.dataType !== undefined && value.dataType === "Set") {
                    return new Set(value.value);
                }
                if (value.label !== undefined) {
                    const node = new DeltaNode(value.label);
                    for (const property in value) {
                        node[property] = value[property];
                    }
                    for (let i = 0; i < node._childNodes.length; i++) {
                        node._childNodes[i].parent = node;
                        node._childNodes[i].childIndex = i;
                    }
                    return node;
                }
            }
            return value;
        }

        return JSON.parse(str, reviver);
    }

    removeFromParent() {
        //adjust parent placeholders
        for (const placeholder of this._parent.placeholders) {
            if (placeholder.index > this._childIndex) {
                placeholder.index--;
            }
        }
        super.removeFromParent();
    }

    isUpdated() {
        return this.updates.length > 0;
    }

    toString() {
        let res = this.label;
        res += " <" + this.changeType + (this.isUpdated() ? "-UPD" : "") + (this.moveIndex !== null ? "_" + this.moveIndex : "") + ">";
        if (this.isUpdated()) {
            for (const update of this.updates) {
                res += " " + update[0] + ": [" + update[1] + "] -> [" + update[2] + "]";
            }
        }
        return res;
    }

    copy(includeChildNodes = true) {
        return DeltaNode.parseFromJson(this.convertToJson(includeChildNodes));
    }
}

exports.DeltaNode = DeltaNode;