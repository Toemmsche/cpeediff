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

    //TODO parent and sibling relationship, fingerprint considering path and subtree (maybe separate for each)
    //CPEE information
    label;
    attributes;
    childAttributes;
    touchedVariables;
    data;

    //structural information
    parent;
    childIndex;
    childNodes;

    constructor(label) {
        this.label = label;
        this.attributes = new Map();
        this.childAttributes = new Map();
        this.childNodes = [];
        this.data = "";
        this.parent = null;
        this.childIndex = null;
        this.touchedVariables = new Set();
    }

    get typeIndex() {
        let index = 0;
        for (let i = 0; i < this.childIndex; i++) {
            if (this.parent.childNodes[i].label === this.label) {
                index++;
            }
        }
        return index;
    }

    get path() {
        const pathArr = [];
        let node = this;
        const isPropertyNode = this.isPropertyNode();
        while(node !== null && (!isPropertyNode || node.isPropertyNode())) {
            pathArr.push(node);
            node = node.parent;
        }
        return pathArr.reverse();
    }

    nodeEquals(other) {
        //only compare internal data, not child nodes
        if (this.label !== other.label) return false;
        if (this.data !== other.data) return false;
        if (this.attributes.size !== other.attributes.size) return false;
        for (const [key, value] of this.attributes) {
            if (value !== other.attributes.get(key)) return false;
        }
        if (this.childAttributes.size !== other.childAttributes.size) return false;
        for (const [key, value] of this.childAttributes) {
            //value is a CPEENode
            if (value !== other.childAttributes.get(key)) {
                return false;
            }
        }
        return true;
    }

    compareTo(other) {
        //specific subclass implementation may be present
        if(this.nodeEquals(other)) return 0;
        else return 1;
    }

    hasChildren() {
        return this.childNodes.length > 0;
    }

    hasAttributes() {
        return this.attributes.size > 0 || this.childAttributes.size > 0
    }

    hasInternalOrdering() {
        return DSL.hasInternalOrdering(this.label);
    }

    isControlFlowLeafNode() {
        return DSL.isControlFlowLeafNode(this.label);
    }

    isPropertyNode() {
        return DSL.isPropertyNode(this.label);
    }

    isEmpty() {
        return !this.isControlFlowLeafNode()
            && this.data == ""
            && !this.hasAttributes()
            && !this.hasChildren();
    }

    isDocumentation() {
        return this.label === "description"
            && !this.hasChildren()
            && !this.hasAttributes();
    }

    containsCode() {
        return DSL.containsCode(this.label);
    }

    appendChild(node) {
        node.childIndex = this.childNodes.push(node) - 1;
        node.parent = this;
    }

    insertChild(node, index) {
        this.childNodes.splice(index, 0, node);
        node.parent = this;
        this._fixChildIndices();
    }

    changeChildIndex(newIndex) {
        //delete
        this.parent.childNodes.splice(this.childIndex, 1);
        //insert
        this.parent.childNodes.splice(newIndex, 0, this);
        //adjust child indices
        this.parent._fixChildIndices();
    }

    removeFromParent() {
        if (this.parent === null) {
            throw new Error("Cannot remove node that has no parent");
        }
        this.parent.childNodes.splice(this.childIndex, 1);
        this.parent._fixChildIndices();
    }

    _fixChildIndices() {
        for (let i = 0; i < this.childNodes.length; i++) {
            this.childNodes[i].childIndex = i;
        }
    }

    static STRING_OPTIONS = {
        LABEL: 1,
        LABEL_WITH_TYPE_INDEX: 2,
        PATH:3,
        PATH_WITH_TYPE_INDEX: 4
    }

    toString(displayType = CPEENode.STRING_OPTIONS.LABEL) {
        switch (displayType) {
            case CPEENode.STRING_OPTIONS.LABEL:
                return this.label;
            case CPEENode.STRING_OPTIONS.LABEL_WITH_TYPE_INDEX:
                return this.label + "[" + this.typeIndex + "]";
            case CPEENode.STRING_OPTIONS.PATH_WITH_TYPE_INDEX: {
                const strArr = this.path.map(n => n.toString("label-with-type-index"));
                return "(" + strArr.join("/") + ")";
            }
            case CPEENode.STRING_OPTIONS.PATH: {
                const strArr = this.path.map(n => n.toString("label"));
                return strArr.join("/");
            }
            default:
                return this.label;
        }
    }

    //TODO beautify... (and optimize)
    //similar to unix tree command
    toTreeString(barList, displayType) {
        const isLast = this.parent !== null && this.childIndex === this.parent.childNodes.length - 1;
        let line = "";
        for (let i = 0; i < barList.length; i++) {
            const spaceCount = barList[i] - (i > 0 ? barList[i - 1] : 0) - 1;
            line += " ".repeat(spaceCount);
            if (i === barList.length - 1) {
                if (isLast) {
                    line += "└";
                } else {
                    line += "├";
                }
            } else {
                line += "│";
            }
        }
        if (isLast) {
            barList.pop();
        }
        line += "─";
        barList.push(line.length + 1);
        line += this.toString(displayType) + "\n";
        if (this.hasChildren()) {
            for (const child of this.childNodes) {
                line += child.toTreeString(barList, displayType);
            }
        } else {
            //bar is popped by last child
            barList.pop();
        }

        return line;
    }
    
    copy() {
        const copy = new CPEENode(this.label, this.parent, this.childIndex);
        copy.data = this.data;
        copy.tempSubTree = this.tempSubTree;
        for (const [key, value] of this.attributes) {
            copy.attributes.set(key, value);
        }
        return copy;
    }

    toPreOrderArray() {
        const preOrderArr = [];
        fillPreOrderArray(this, preOrderArr);

        function fillPreOrderArray(node, arr) {
            arr.push(node);
            for (const child of node.childNodes) {
                fillPreOrderArray(child, arr);
            }
        }

        return preOrderArr;
    }

    toPostOrderArray() {
        const postOrderArr = [];
        fillPostOrderArray(this, postOrderArr);

        function fillPostOrderArray(node, arr) {
            for (const child of node.childNodes) {
                fillPostOrderArray(child, arr);
            }
            arr.push(node);
        }

        return postOrderArr;
    }

    convertToJSON() {
        function replacer(key, value) {
            if (key === "parent" || key === "path" || key === "tempSubTree") return undefined;
            //convert maps to arrays of key-value pairs
            else if (value instanceof Map) {
                return {
                    //preserve data type for correct parsing
                    dataType: "Map",
                    value: Array.from(value.entries())
                };
            }
            return value;
        }

        return JSON.stringify(this, replacer);
    }

    static parseFromJSON(str) {
        function reviver(key, value) {
            if(value instanceof Object) {
                //all maps are marked
                if (value.dataType === "Map") {
                    return new Map(value.value)
                }
            }
            return value;
        }

        return JSON.parse(str, reviver)
    }
}

exports.CPEENode = CPEENode;