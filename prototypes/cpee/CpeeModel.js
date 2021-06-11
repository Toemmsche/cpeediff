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

//TODO doc
const {Serializable} = require("../utils/Serializable");
const {DeltaNode} = require("./DeltaNode");
const {CpeeNode} = require("./CpeeNode");

class CpeeModel extends Serializable{

    /**
     * @type CpeeNode
     */
    root;

    constructor(root) {
        super();
        this.root = root;
    }

    copy() {
        return new CpeeModel(this.root.copy(true));
    }

    deltaCopy() {
        return new CpeeModel(DeltaNode.fromCpeeNode(this.root, true));
    }

    toPreOrderArray() {
        return this.root.toPreOrderArray();
    }

    toPostOrderArray() {
        return this.root.toPostOrderArray();
    }

    leafNodes() {
        return this.toPreOrderArray().filter(n => n.isControlFlowLeafNode());
    }

    convertToXml(xmlDom = false) {
        return this.root.convertToXml(xmlDom);
    }

    static parseFromXml(xml, xmlDom = false, deltaModel = false) {
        if(deltaModel) {
            return new CpeeModel(DeltaNode.parseFromXml(xml, xmlDom));
        } else {
            return new CpeeModel(CpeeNode.parseFromXml(xml, xmlDom));
        }
    }
}

exports.CpeeModel = CpeeModel;