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
    /**
     * @type String
     */
    label;
    /**
     * @type Map<String,String>
     */
    attributes;
    /**
     * @type Map<String,String>
     */
    childAttributes;
    /**
     * @type Set<CPEENode>
     */
    modifiedVariables;
    /**
     * @type Set<CPEENode>
     */
    readVariables;
    /**
     * @type String
     */
    data;

    //structural information
    /**
     * @type CPEENode
     * @private
     */
    _parent;
    /**
     * @type Number
     * @private
     */
    _childIndex;
    /**
     * @type CPEENode[]
     * @private
     */
    _childNodes;

    constructor(label) {
        this.label = label;
        this.attributes = new Map();
        this.childAttributes = new Map();
        this.modifiedVariables = new Set();
        this.readVariables = new Set();
        this.data = "";

        this._childNodes = [];
        this._parent = null;
        this._childIndex = 0;
    }

    /**
     * @returns {Number}
     */
    get typeIndex() {
        let index = 0;
        for (let i = 0; i < this._childIndex; i++) {
            if (this._parent.childNodes[i].label === this.label) {
                index++;
            }
        }
        return index;
    }

    /**
     * @returns {CPEENode[]}
     */
    get path() {
        const pathArr = [];
        let node = this;
        const isPropertyNode = this.isPropertyNode();
        while (node != null && (!isPropertyNode || node.isPropertyNode())) {
            pathArr.push(node);
            node = node._parent;
        }
        return pathArr.reverse();
    }

    /**
     * @returns {CPEENode}
     */
    get parent() {
        return this._parent;
    }

    /**
     *
     * @param {CPEENode} parentNode
     */
    set parent(parentNode) {
        this._parent = parentNode;
    }

    /**
     * @returns {CPEENode[]}
     */
    get childNodes() {
        return this._childNodes;
    }

    /**
     *
     * @param {CPEENode[]} newChildNodes
     */
    set childNodes(childNodes) {
        this._childNodes = childNodes;
    }

    /**
     * @returns {Number}
     */
    get childIndex() {
        return this._childIndex;
    }

    /**
     *
     * @param {Number} childIndex
     */
    set childIndex(childIndex) {
        this._childIndex = childIndex;
    }

    /**
     *
     * @param {CPEENode} other
     * @returns {boolean}
     */
    nodeEquals(other) {
        for (const member in this) {
            //only check public members
            if (!member.startsWith("_")) {
                const thisValue = this[member];
                const otherValue = other[member];
                if (thisValue instanceof Set) {
                    if (thisValue.size !== otherValue.size) return false;
                    for (const element of thisValue) {
                        if (!otherValue.has(element)) return false;
                    }
                } else if (thisValue instanceof Map) {
                    if (thisValue.size !== otherValue.size) return false;
                    for (const [key, value] of thisValue) {
                        if (otherValue.get(key) !== value) return false;
                    }
                } else if (thisValue !== otherValue) {
                    return false;
                }
            }
        }
        return true;
    }

    /**
     *
     * @param {CPEENode} other
     * @returns {number}
     */
    compareTo(other) {
        //specific subclass implementation may be present
        if (this.nodeEquals(other)) return 0;
        else return 1;
    }

    /**
     * @returns {boolean}
     */
    hasChildren() {
        return this._childNodes.length > 0;
    }

    /**
     *
     * @returns {boolean}
     */
    hasAttributes() {
        return this.attributes.size > 0 || this.childAttributes.size > 0
    }

    /**
     *
     * @returns {boolean}
     */
    hasInternalOrdering() {
        return DSL.hasInternalOrdering(this.label);
    }

    /**
     *
     * @returns {boolean}
     */
    isControlFlowLeafNode() {
        return DSL.isControlFlowLeafNode(this.label);
    }

    /**
     *
     * @returns {boolean}
     */
    isPropertyNode() {
        return DSL.isPropertyNode(this.label);
    }

    /**
     *
     * @returns {boolean}
     */
    isEmpty() {
        return !this.isControlFlowLeafNode()
            && this.data == ""
            && !this.hasAttributes()
            && !this.hasChildren();
    }

    /**
     *
     * @returns {boolean}
     */
    isDocumentation() {
        return this.label === "description"
            && !this.hasChildren()
            && !this.hasAttributes();
    }

    /**
     *
     * @returns {boolean}
     */
    containsCode() {
        //TODO replace with check of has()
        return DSL.containsCode(this.label);
    }

    /**
     *  @returns {boolean}
     */
    containsCondition() {
        return this.attributes.has("condition");
    }

    /**
     *
     * @param {CPEENode} node
     */
    appendChild(node) {
        node._childIndex = this._childNodes.push(node) - 1;
        node._parent = this;
    }

    /**
     *
     * @param {CPEENode} node
     * @param {Number} index
     */
    insertChild(node, index) {
        this._childNodes.splice(index, 0, node);
        node.parent = this;
        this._fixChildIndices();
    }

    /**
     *
     * @param {Number} newIndex
     */
    changeChildIndex(newIndex) {
        //delete
        this._parent.childNodes.splice(this._childIndex, 1);
        //insert
        this._parent.childNodes.splice(newIndex, 0, this);
        //adjust child indices
        this._parent._fixChildIndices();
    }

    removeFromParent() {
        if (this._parent === null) {
            throw new Error("Cannot remove node that has no parent");
        }
        this._parent.childNodes.splice(this._childIndex, 1);
        this._parent._fixChildIndices();
    }

    _fixChildIndices() {
        for (let i = 0; i < this._childNodes.length; i++) {
            this._childNodes[i].childIndex = i;
        }
    }

    /**
     * @type {{PATH: number, CHILD_INDEX_ONLY: number, LABEL: number, CHANGE: number, LABEL_WITH_TYPE_INDEX: number, PATH_WITH_TYPE_INDEX: number}}
     */
    static STRING_OPTIONS = {
        LABEL: 1,
        LABEL_WITH_TYPE_INDEX: 2,
        PATH: 3,
        PATH_WITH_TYPE_INDEX: 4,
        CHILD_INDEX_ONLY: 5,
        CHANGE: 6
    }

    /**
     *
     * @param {Number} displayType
     * @returns {String}
     */
    toString(displayType = CPEENode.STRING_OPTIONS.LABEL) {
        switch (displayType) {
            case CPEENode.STRING_OPTIONS.LABEL:
                return this.label;
            case CPEENode.STRING_OPTIONS.LABEL_WITH_TYPE_INDEX:
                return this.label + "[" + this.typeIndex + "]";
            case CPEENode.STRING_OPTIONS.PATH_WITH_TYPE_INDEX: {
                const strArr = this.path.map(n => n.toString("label-with-type-index"));
                return strArr.join("/");
            }
            case CPEENode.STRING_OPTIONS.PATH: {
                const strArr = this.path.map(n => n.toString("label"));
                return strArr.join("/");
            }
            case CPEENode.STRING_OPTIONS.CHILD_INDEX_ONLY: {
                const strArr = this.path.map(n => n.childIndex);
                return strArr.join("/");
            }
            case CPEENode.STRING_OPTIONS.CHANGE:
                if ("changeType" in this) {
                    return this.label + " <" + this.changeType + ">";
                }
                return this.label;
            default:
                return this.label;
        }
    }

    //TODO beautify... (and optimize)
    //similar to unix tree command
    /**
     *
     * @param {Number[]} barList
     * @param {Number} stringOption
     * @returns {String}
     */
    toTreeString(barList, stringOption) {
        const isLast = this._parent != null && this._childIndex === this._parent.childNodes.length - 1;
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
        const lineLength = line.length;
        line += this.toString(stringOption) + "\n";
        if (this.hasChildren()) {
            barList.push(lineLength + 1);
            for (const child of this._childNodes) {
                line += child.toTreeString(barList, stringOption);
            }
        }
        return line;
    }

    /**
     *
     * @param {CPEENode[]} arr
     * @returns {CPEENode[]}
     */
    toPreOrderArray(arr = []) {
        arr.push(this);
        for (const child of this._childNodes) {
            child.toPreOrderArray(arr);
        }
        return arr;
    }

    /**
     *
     * @param {CPEENode[]} arr
     * @returns {CPEENode[]}
     */
    toPostOrderArray(arr = []) {
        for (const child of this._childNodes) {
            child.toPostOrderArray(arr);
        }
        arr.push(this);
        return arr;
    }

    /**
     *
     * @returns {String}
     */
    convertToJSON() {
        function replacer(key, value) {
            if (key === "_parent") return undefined;
            //convert maps to arrays of key-value pairs
            else if (value instanceof Map) {
                return {
                    //preserve data type for correct parsing
                    dataType: "Map",
                    value: Array.from(value.entries())
                };
            } else if (value instanceof Set) {
                return {
                    //preserve data type for correct parsing
                    dataType: "Set",
                    value: Array.from(value.keys())
                };
            }
            return value;
        }

        return JSON.stringify(this, replacer);
    }
}

exports.CPEENode = CPEENode;