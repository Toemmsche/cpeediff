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

const {LCSSimilarity} = require("../utils/LCSSimilarity");
const {Serializable} = require("../utils/Serializable");

class CPEENode extends Serializable {

    static KEYWORDS = {
        ROOT: "description",
        CALL: "call",
        MANIPULATE: "manipulate",
        PARALLEL: "parallel",
        PARALLEL_BRANCH: "parallel_branch",
        CHOOSE: "choose",
        ALTERNATIVE: "alternative",
        OTHERWISE: "otherwise",
        LOOP: "loop",
        CRITICAL: "critical",
        STOP: "stop",
        ESCAPE: "escape",
        TERMINATE: "terminate"
    }


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
     * @type String
     */
    data;

    //private
    /**
     * @type Set<CPEENode>
     */
    modifiedVariables;
    /**
     * @type Set<CPEENode>
     */
    readVariables;

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
        super();
        this.label = label;
        this.attributes = new Map();
        this.attributes = new Map();
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
     * @returns {IterableIterator<CPEENode>}
     */
    [Symbol.iterator]() {
        return this._childNodes[Symbol.iterator]();
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
        switch (this.label) {
            case "call": {
                //we cannot possibly match a call with another node type
                if (this.label !== other.label) return 1.0;
                /*
                To compare call nodes, a fixed number of separate comparison groups are defined.
                If two nodes exhibit differences in almost all of the groups, a high comparison value (= low similarity) will be returned.
                If two nodes are identical in many of the groups, a low comparison value (= high similarity) will be returned.
                The preliminary comparison groups are focussed around the endpoint (endPoint descriptor and method),
                the variables modified in the code, and the variables read in the code or as parameters for the call.
                 */

                const thisEndpoint = this.attributes.get("endpoint");
                const otherEndpoint = other.attributes.get("endpoint");
                const endPointLcsSimilarity = LCSSimilarity.getLCS(thisEndpoint, otherEndpoint).length
                    / Math.max(thisEndpoint.length, otherEndpoint.length);
                let endPointComparisonValue = 1 - endPointLcsSimilarity * endPointLcsSimilarity;
                if(this.attributes.get("./parameters/label") === other.attributes.get("./parameters/label")) {
                    //TODO maybe use LCS, too
                    endPointComparisonValue *= 0.5;
                }
                if(this.attributes.get("./parameters/method") !== other.attributes.get("./parameters/method")) {
                    endPointComparisonValue = Math.min(1.5*endPointComparisonValue, 1);
                }


                let differentCounter = 0;
                for (const modifiedVariable of this.modifiedVariables) {
                    if (!other.modifiedVariables.has(modifiedVariable)) {
                        differentCounter++;
                    }
                }
                for (const otherModifiedVariable of other.modifiedVariables) {
                    if (!this.modifiedVariables.has(otherModifiedVariable)) {
                        differentCounter++;
                    }
                }
                let maxSize = Math.max(this.modifiedVariables.size, other.modifiedVariables.size);
                //avoid NaN
                if(maxSize === 0) {
                    maxSize = 1;
                }
                const modifiedVariablesComparisonValue = differentCounter / maxSize;

                differentCounter = 0;
                for (const readVariable of this.readVariables) {
                    if (!other.readVariables.has(readVariable)) {
                        differentCounter++;
                    }
                }
                for (const otherReadVariable of other.readVariables) {
                    if (!this.readVariables.has(otherReadVariable)) {
                        differentCounter++;
                    }
                }
                maxSize = Math.max(this.readVariables.size, other.readVariables.size);
                //avoid NaN
                if(maxSize === 0) {
                    maxSize = 1;
                }
                const readVariablesComparisonValue = differentCounter / maxSize;


                //endpoint and modified variables have higher weights
                return endPointComparisonValue * 0.4 + modifiedVariablesComparisonValue * 0.4 + readVariablesComparisonValue * 0.2;
            }

            case "manipulate": {
                //we can't match a script to a regular call
                if (this.label !== other.label) {
                    return 1;
                }
                const total = Math.max(this.modifiedVariables.size, other.modifiedVariables.size);
                let differentCounter = 0;
                for (const variable of this.modifiedVariables) {
                    if (!other.modifiedVariables.has(variable)) {
                        differentCounter++;
                    }
                }
                for (const variable of other.modifiedVariables) {
                    if (!this.modifiedVariables.has(variable)) {
                        differentCounter++;
                    }
                }
                let compValue = differentCounter / (2 * total);
                return compValue;
            }

            case "parallel": {
                if (this.label !== other.label) {
                    return 1;
                }
                let compareValue = 0;
                //wait attribute dictates the number of branches that have to finish until execution proceeds
                if (this.attributes.has("wait") && this.attributes.get("wait") !== other.attributes.get("wait")) {
                    compareValue += 0.2;
                }
                return compareValue;
            }

            default: {
                //hard comparison
                if (this.nodeEquals(other)) return 0;
                else return 1;
            }
        }
    }

    /**
     *  @returns {String}
     */
    getCode() {
        if (this.containsCode()) {
            if (this.label === "manipulate") {
                return this.data;
            } else {
                const prepare = (this.attributes.has("./code/prepare") ? this.attributes.get("./code/prepare") : "");
                const finalize = (this.attributes.has("./code/finalize") ? this.attributes.get("./code/finalize") : "");
                const update = (this.attributes.has("./code/update") ? this.attributes.get("./code/update") : "");
                const rescue = (this.attributes.has("./code/rescue") ? this.attributes.get("./code/rescue") : "");
                return prepare + finalize + update + rescue;
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
        return [CPEENode.KEYWORDS.LOOP,
            CPEENode.KEYWORDS.CRITICAL,
            CPEENode.KEYWORDS.ROOT,
            CPEENode.KEYWORDS.ALTERNATIVE,
            CPEENode.KEYWORDS.OTHERWISE,
            CPEENode.KEYWORDS.PARALLEL_BRANCH].includes(this.label);
    }

    /**
     *
     * @returns {boolean}
     */
    isControlFlowLeafNode() {
        return [CPEENode.KEYWORDS.CALL,
            CPEENode.KEYWORDS.MANIPULATE,
            CPEENode.KEYWORDS.TERMINATE,
            CPEENode.KEYWORDS.STOP,
            CPEENode.KEYWORDS.ESCAPE].includes(this.label);
    }

    /**
     *
     * @returns {boolean}
     */
    isPropertyNode() {
        for (const cpeeKeyWord in CPEENode.KEYWORDS) {
            if (this.label === CPEENode.KEYWORDS[cpeeKeyWord]) return false;
        }
        return true;
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
        return this.label === "manipulate"
            || this.attributes.has("./code/finalize")
            || this.attributes.has("./code/prepare")
            || this.attributes.has("./code/rescue")
            || this.attributes.has("./code/update");
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
                if (this.changeType !== undefined) {
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
        //TODO
        if (this.placeholders !== undefined) {
            for (const index of this.placeholders) {
                this.insertChild(new CPEENode("<Placeholder>"), index);
            }
        }
        const isLast = this._parent != null && this._childIndex === this._parent._childNodes.length - 1;
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
            for (const child of this) {
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
        for (const child of this) {
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
        for (const child of this) {
            child.toPostOrderArray(arr);
        }
        arr.push(this);
        return arr;
    }

    /**
     *  @override
     * @returns {String}
     */
    convertToJson() {
        function replacer(key, value) {
            if (key === "_parent" || key === "_childIndex") {
                return undefined;
            } else if (value == "" || value.length === 0 || value.size === 0) {  //ignore empty strings, arrays, sets, and maps
                return undefined;
            } else if (value instanceof Map) {
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
                }
            }
            return value;
        }

        return JSON.stringify(this, replacer);
    }

    /**
     *
     * @override
     * @returns {CPEENode}
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
                    const node = new CPEENode(value["label"]);
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

    copy() {
        return CPEENode.parseFromJson(this.convertToJson());
    }
}

exports.CPEENode = CPEENode;