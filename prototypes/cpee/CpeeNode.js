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

const xmldom = require("xmldom");
const vkbeautify = require("vkbeautify");
const {Dsl} = require("../Dsl");
const {Change} = require("../editscript/Change");
const {Config} = require("../Config");
const {Serializable} = require("../utils/Serializable");

class CpeeNode extends Serializable {

    //TODO parent and sibling relationship, fingerprint considering path and subtree (maybe separate for each)
    /**
     * @type {{PATH: number, CHILD_INDEX_ONLY: number, LABEL: number, CHANGE: number, LABEL_WITH_TYPE_INDEX: number, PATH_WITH_TYPE_INDEX: number}}
     */
    static STRING_OPTIONS = {
        LABEL: 1,
        LABEL_WITH_TYPE_INDEX: 2,
        PATH: 3,
        PATH_WITH_TYPE_INDEX: 4
    }
    //cpee information
    /**
     * @type String
     */
    label;
    /**
     * @type Map<String,String>
     */
    attributes;
    /**
     * @type String
     */
    data;

    constructor(label) {
        super();
        this.label = label;
        this.attributes = new Map();
        this.data = null;

        this._childNodes = [];
        this._parent = null;
        this._childIndex = null;
    }

    //structural information
    /**
     * @type CpeeNode
     * @private
     */
    _parent;

    /**
     * @returns {CpeeNode}
     */
    get parent() {
        return this._parent;
    }

    /**
     * @type Number
     * @private
     */
    _childIndex;

    /**
     * @returns {Number}
     */
    get childIndex() {
        return this._childIndex;
    }

    /**
     * @type CpeeNode[]
     * @private
     */
    _childNodes;

    /**
     * @returns {CpeeNode[]}
     */
    get childNodes() {
        return this._childNodes;
    }

    /**
     *
     * @param {CpeeNode[]} newChildNodes
     */
    set childNodes(childNodes) {
        this._childNodes = childNodes;
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
     * @returns {CpeeNode[]}
     */
    get path() {
        const pathArr = [];
        let node = this;
        while (node != null) {
            if (pathArr.includes(node)) {
                console.log("up")
            }
            pathArr.push(node);
            node = node._parent;
        }
        return pathArr.reverse().slice(1);
    }

    get modifiedVariables() {
        const modifiedVariables = new Set();
        if (this.containsCode()) {
            //match all variable assignments of the form variable_1.variable_2.variable_3 = some_value
            const matches = this.getCode().match(/data\.[a-zA-Z]+\w*(?: *( =|\+\+|--|-=|\+=|\*=|\/=))/g);
            if (matches !== null) {
                for (const variable of matches) {
                    //match only variable name and remove data. prefix
                    modifiedVariables.add(variable.match(/(?:data\.)[a-zA-Z]+\w*/g)[0].replace(/data\./, ""));
                }
            }
        }
        return modifiedVariables;
    }

    get readVariables() {
        //TODO extract from code as well
        const readVariables = new Set();
        if (this.containsCondition()) {
            const condition = this.attributes.get("condition");
            const matches = condition.match(/data\.[a-zA-Z]+\w*(?: *(<|<=|>|>=|==|===|!=|!==))/g);
            if (matches !== null) {
                for (const variable of matches) {
                    //match only variable name and remove data. prefix
                    readVariables.add(variable.match(/(?:data\.)[a-zA-Z]+\w*/g)[0].replace(/data\./, ""));
                }
            }
        }
        return readVariables;
    }
    
    contentHash() {
        const sortedAttrList = new Array(this.attributes.keys()).sort()
        let contentHash= this.label;
        for(const key in sortedAttrList) {
            contentHash+= key + "=" + this.attributes.get(key);
        }
        contentHash+= this.data;
        return contentHash;
    }
    
    childHash() {
        let childHash = "";
        if(this.hasInternalOrdering()) {
            //preserve order
            childHash += this._childNodes.map(n => n.nodeHash()).join("");
        } else {
            childHash += this._childNodes.map(n => n.nodeHash()).sort().join("");
        }
        return childHash;
    }

    nodeHash() {
        return this.contentHash() + this.childHash();
    }

    static parseFromXml(xml, xmlDom = false) {
        if (xmlDom) {
            return constructRecursive(xml);
        } else {
            const doc = new xmldom.DOMParser().parseFromString(xml, "text/xml");
            return constructRecursive(doc.firstChild);
        }

        function constructRecursive(tNode) {
            let root = new CpeeNode(tNode.localName);
            for (let i = 0; i < tNode.childNodes.length; i++) {
                const childTNode = tNode.childNodes.item(i);
                if (childTNode.nodeType === 3) { //text node
                    //check if text node contains a non-empty payload
                    if (childTNode.data.match(/^\s*$/) !== null) { //match whole string
                        //empty data, skip
                        continue;
                    } else {
                        //relevant data, set as node data
                        root.data = childTNode.data;
                    }
                } else {
                    const child = constructRecursive(childTNode)
                    root.appendChild(child);
                }
            }

            //parse attributes
            for (let i = 0; i < tNode.attributes.length; i++) {
                const attrNode = tNode.attributes.item(i);
                root.attributes.set(attrNode.name, attrNode.value);
            }

            return root;
        }
    }

    /**
     * @returns {IterableIterator<CpeeNode>}
     */
    [Symbol.iterator]() {
        return this._childNodes[Symbol.iterator]();
    }

    /**
     *
     * @returns {number}
     */
    numChildren() {
        return this._childNodes.length;
    }

    /**
     *
     * @param index
     * @returns {CpeeNode}
     */
    getChild(index) {
        return this._childNodes[index];
    }

    /**
     *
     * @returns {CpeeNode[]}
     */
    getSiblings() {
        return this._parent._childNodes;
    }

    /**
     *
     * @param {CpeeNode} other
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
     * @param {CpeeNode} other
     */
    contentEquals(other) {
        if (this.attributes.size !== other.attributes.size) return false;
        for (const [key, value] of this.attributes) {
            if (other.attributes.get(key) !== value) return false;
        }
        if (this.data != other.data) return false;
        return true;
    }

    /**
     * @param {CpeeNode} other
     * @returns {boolean}
     */
    nodeTypeEquals(other) {
        return this.label === other.label;
    }

    /**
     *  @returns {String}
     */
    getCode() {
        if (this.containsCode()) {
            if (this.label === "manipulate") {
                return this.data;
            } else {
                let code = "";
                const codeNode = this._childNodes.find(n => n.label === "code");
                for (const child of codeNode) {
                    code += child.data;
                }
                return code;
            }
        }
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
        return this.attributes.size > 0
    }

    /**
     *
     * @returns {boolean}
     */
    hasInternalOrdering() {
        return Dsl.INTERNAL_ORDERING_SET.has(this.label);
    }

    /**
     *
     * @returns {boolean}
     */
    isControlFlowLeafNode() {
        return Dsl.LEAF_NODE_SET.has(this.label);
    }

    /**
     *
     * @returns {boolean}
     */
    isPropertyNode() {
       return !Dsl.KEYWORD_SET.has(this.label);
    }

    isRoot() {
        return this.label === Dsl.KEYWORDS.ROOT.label && this._parent == null;
    }
    /**
     *
     * @returns {boolean}
     */
    isEmpty() {
        return !this.isControlFlowLeafNode()
            && (this.data === "" || this.data == null)
            && !this.hasAttributes()
            && !this.hasChildren();
    }

    /**
     *
     * @returns {boolean}
     */
    containsCode() {
        return this.label === "manipulate"
            || this._childNodes.some(n => n.label === "code");
    }

    /**
     *  @returns {boolean}
     */
    containsCondition() {
        return this.attributes.has("condition");
    }

    /**
     *
     * @param {CpeeNode} node
     */
    appendChild(node) {
        node._childIndex = this._childNodes.push(node) - 1;
        node._parent = this;
        //fixChildIndices can be omitted as no other children are affected
    }

    /**
     *
     * @param {Number} index
     * @param {CpeeNode} node
     */
    insertChild(index, node) {
        this._childNodes.splice(index, 0, node);
        node._parent = this;
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
        if (this._parent != null) {
            this._parent.childNodes.splice(this._childIndex, 1);
            this._parent._fixChildIndices();
        } else {
            console.log("Cannot remove node that has no parent");
        }

    }

    _fixChildIndices() {
        for (let i = 0; i < this._childNodes.length; i++) {
            this._childNodes[i]._childIndex = i;
        }
    }

    /**
     *
     * @returns {CpeeNode}
     */
    getParentLeaf() {
        if (!this.isPropertyNode()) {
            throw new Error("Non-property node does not have a parent leaf node");
        }
        let node = this;
        while (node.isPropertyNode()) {
            node = node._parent;
        }
        return node;
    }

    toChildIndexPathString() {
        //discard root node
        return this.path.map(n => n.childIndex).join("/");
    }

    toPropertyPathString() {
        const pathArr = [];
        let node = this;
        const isPropertyNode = this.isPropertyNode();
        while (node != null && (!isPropertyNode || node.isPropertyNode())) {
            if (pathArr.includes(node)) {
                console.log("up")
            }
            pathArr.push(node);
            node = node._parent;
        }
        return pathArr.reverse().slice(1).map(n => n.label);
    }

    toString() {
        return this.label;
    }

    /**
     *
     * @param {CpeeNode[]} arr
     * @returns {CpeeNode[]}
     */
    toPreOrderArray(arr = []) {
        arr.push(this);
        for (const child of this) {
            child.toPreOrderArray(arr);
        }
        return arr;
    }

    /**
     *
     * @param {CpeeNode[]} arr
     * @returns {CpeeNode[]}
     */
    toPostOrderArray(arr = []) {
        for (const child of this) {
            child.toPostOrderArray(arr);
        }
        arr.push(this);
        return arr;
    }

    copy(includeChildNodes = true) {
        const copy = new CpeeNode(this.label);
        copy.data = this.data;
        for (const [key, value] of this.attributes) {
            copy.attributes.set(key, value);
        }
        if (includeChildNodes) {
            for (const child of this) {
                copy.appendChild(child.copy(true))
            }
        }
        return copy;
    }

    convertToXml(xmlDom = false, includeChildNodes = true, ) {
        const doc = xmldom.DOMImplementation.prototype.createDocument(Dsl.NAMESPACES.DEFAULT_NAMESPACE_URI);

        const root = constructRecursive(this);

        if (xmlDom) {
            return root;
        } else {
            doc.insertBefore(root, null);
            return vkbeautify.xml(new xmldom.XMLSerializer().serializeToString(doc));
        }

        function constructRecursive(cpeeNode) {
            const node = doc.createElement(cpeeNode.label);
            if (cpeeNode.isRoot()) {
                node.setAttribute("xmlns", Dsl.NAMESPACES.DEFAULT_NAMESPACE_URI);
            }
            for (const [key, value] of cpeeNode.attributes) {
                node.setAttribute(key, value);
            }
            if (includeChildNodes) {
                for (const child of cpeeNode) {
                    node.appendChild(constructRecursive(child));
                }
            }
            if (cpeeNode.data != null) {
                node.appendChild(doc.createTextNode(cpeeNode.data))
            }
            return node;
        }
    }

}

exports.CpeeNode = CpeeNode;