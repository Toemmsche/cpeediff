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

    changeType;
    updated;

    constructor(label, changeType = "NIL", updated = false) {
        super(label);
        this.changeType = changeType;
        this.updated = updated;
    }

    /**
     *
     * @override
     * @returns {CpeeNode}
     */
    static parseFromJson(str) {
        function reviver(key, value) {
            if (value instanceof Object) {
                //all maps are marked
                if ("dataType" in value && value.dataType === "Map") {
                    return new Map(value.value);
                } else if ("dataType" in value && value.dataType === "Set") {
                    return new Set(value.value);
                }
                if ("label" in value) {
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

        return JSON.parse(str, reviver)
    }

    toString() {
        return this.label + " <" + this.changeType + (this.updated ? "-UPD" : "") + ">";
    }
}

exports.DeltaNode = DeltaNode;