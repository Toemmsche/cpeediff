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

const {DSL} = require("./DSL");

class CPEENode {

    //TODO parent and sibling relationship, fingerpringt considering path and subtree (maybe separate for each)
    //node label (implies type)
    label;
    //Map of key-value attributes
    attributes;
    //ordered child CPEENodes
    childNodes;
    //string data of the node
    data;
    parent;
    childIndex;
    path;

    tempSubTree;

    constructor(label, parent = null, childIndex = -1) {
        this.label = label;
        this.attributes = new Map();
        this.childNodes = [];
        this.data = "";
        this.parent = parent;
        this.childIndex = childIndex;
        if (this.parent == null) {
            this.path = [];
        } else {
            //copy parent path
            this.path = this.parent.path.slice();
        }
        this.path.push(this);


        //TODO
        this.tempSubTree = [];
    }

    hasInternalOrdering() {
        return DSL.hasInternalOrdering(this.label);
    }

    nodeEquals(other) {
        //only compare internal data, not child nodes
        if (this.label !== other.label) return false;
        if (this.data !== other.data) return false;
        if (this.attributes.size !== other.attributes.size) return false;
        for (const [key, value] of this.attributes) {
            if (value !== other.attributes.get(key)) return false;
        }
        return true;
    }

    subTreeEquals(other) {
        //compare node data and child node data (ordered!)
        if (!this.nodeEquals(other)) return false;
        if (this.childNodes.length !== other.childNodes.length) return false;
        for (let i = 0; i < this.childNodes.length; i++) {
            if (!this.childNodes[i].subTreeEquals(other.childNodes[i])) return false;
        }
        return true;
    }

    hasChildren() {
        return this.childNodes.length > 0;
    }

    isControlFlowLeafNode() {
        return DSL.isControlFlowLeafNode(this.label);
    }

    compareTo(other) {
        //sophisticated subclass implementation may be present
        if (this.nodeEquals(other)) return 0;
        else return 1;
    }

    insertChild(cpeeNode) {
        cpeeNode.childIndex = this.childNodes.length;
        cpeeNode.parent = this;
        cpeeNode.path = this.path.splice();
        cpeeNode.path.push(cpeeNode);
        this.childNodes.push(cpeeNode);
    }

    removeFromParent() {
        if (this.parent === null) {
            throw new Error();
        }
        this.parent.childNodes.splice(this.childIndex, 1);
        for (let i = this.childIndex; i < this.parent.childNodes.length; i++) {
            this.parent.childNodes[i].childIndex--;
        }
    }

    toString() {
        return `{"${this.label}" : ${JSON.stringify(Array.from(this.attributes.entries()))}}`
    }

    copy() {
        const copy = new CPEENode(this.label, this.parent, this.childIndex);
        copy.path = this.path;
        copy.data = this.data;
        copy.tempSubTree = this.tempSubTree;
        for(const [key, value] of this.attributes) {
            copy.attributes.set(key, value);
        }
        return copy;
    }
}

exports.CPEENode = CPEENode;