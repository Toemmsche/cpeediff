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

const {Change} = require("../editscript/Change");
const {LCSSimilarity} = require("../utils/LongestCommonSubsequence");
const {Serializable} = require("../utils/Serializable");

class CpeeNode extends Serializable {

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

    /**
     * @type Set<CpeeNode>
     */
    modifiedVariables;
    /**
     * @type Set<CpeeNode>
     */
    readVariables;

    //private
    //diff related information
    _changeType;

    //structural information
    /**
     * @type CpeeNode
     * @private
     */
    _parent;
    /**
     * @type Number
     * @private
     */
    _childIndex;
    /**
     * @type CpeeNode[]
     * @private
     */
    _childNodes;

    constructor(label) {
        super();
        this.label = label;
        this.attributes = new Map();
        this.modifiedVariables = new Set();
        this.readVariables = new Set();
        this.data = "";

        this._changeType = Change.CHANGE_TYPES.NIL;

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
     * @returns {CpeeNode[]}
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
     * @returns {CpeeNode}
     */
    get parent() {
        return this._parent;
    }

    /**
     *
     * @param {CpeeNode} parentNode
     */
    set parent(parentNode) {
        this._parent = parentNode;
    }

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
                if (this.attributes.get("./parameters/label") === other.attributes.get("./parameters/label")) {
                    //TODO maybe use LCS, too
                    endPointComparisonValue *= 0.5;
                }
                if (this.attributes.get("./parameters/method") !== other.attributes.get("./parameters/method")) {
                    endPointComparisonValue = Math.min(1.5 * endPointComparisonValue, 1);
                }

                let maxSize = Math.max(this.modifiedVariables.size, other.modifiedVariables.size);
                let modifiedVariablesComparisonValue;
                //if modifiedVariables is empty, we cannot decide on similarity -> reuse endpoint comparison value
                if (maxSize === 0) {
                    modifiedVariablesComparisonValue = endPointComparisonValue;
                } else {
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
                    modifiedVariablesComparisonValue = differentCounter / maxSize;
                }

                maxSize = Math.max(this.readVariables.size, other.readVariables.size);

                let readVariablesComparisonValue;
                //if readVariables is empty, we cannot decide on similarity -> reuse endpoint comparison value
                if (maxSize === 0) {
                    readVariablesComparisonValue = endPointComparisonValue;
                } else {
                    let differentCounter = 0;
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
                    readVariablesComparisonValue = differentCounter / maxSize;
                }

                //endpoint and modified variables have higher weights
                return endPointComparisonValue * 0.4 + modifiedVariablesComparisonValue * 0.4 + readVariablesComparisonValue * 0.2;
            }

            case "manipulate": {
                if (this.label !== other.label) {
                    return 1;
                }
                /*
                Comparison of two scripts is identical to comparison of two service calls minus the endpoint comparison
                 */
                let maxSize = Math.max(this.modifiedVariables.size, other.modifiedVariables.size);
                let modifiedVariablesComparisonValue;
                //if modifiedVariables is empty, we must return a pessimistic estimate
                if (maxSize === 0) {
                    modifiedVariablesComparisonValue = 1;
                } else {
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
                    modifiedVariablesComparisonValue = differentCounter / maxSize;
                }

                maxSize = Math.max(this.readVariables.size, other.readVariables.size);

                let readVariablesComparisonValue;
                //if readVariables is empty, we cannot decide on similarity -> reuse endpoint comparison value
                if (maxSize === 0) {
                    readVariablesComparisonValue = modifiedVariablesComparisonValue;
                } else {
                    let differentCounter = 0;
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
                    readVariablesComparisonValue = differentCounter / maxSize;
                }

                return 0.7 * modifiedVariablesComparisonValue + 0.3 * readVariablesComparisonValue;
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
                //all-or-nothing comparison
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
        return [CpeeNode.KEYWORDS.LOOP,
            CpeeNode.KEYWORDS.CRITICAL,
            CpeeNode.KEYWORDS.ROOT,
            CpeeNode.KEYWORDS.ALTERNATIVE,
            CpeeNode.KEYWORDS.OTHERWISE,
            CpeeNode.KEYWORDS.PARALLEL_BRANCH].includes(this.label);
    }

    /**
     *
     * @returns {boolean}
     */
    isControlFlowLeafNode() {
        return [CpeeNode.KEYWORDS.CALL,
            CpeeNode.KEYWORDS.MANIPULATE,
            CpeeNode.KEYWORDS.TERMINATE,
            CpeeNode.KEYWORDS.STOP,
            CpeeNode.KEYWORDS.ESCAPE].includes(this.label);
    }

    /**
     *
     * @returns {boolean}
     */
    isPropertyNode() {
        for (const cpeeKeyWord in CpeeNode.KEYWORDS) {
            if (this.label === CpeeNode.KEYWORDS[cpeeKeyWord]) return false;
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
     * @param {CpeeNode} node
     */
    appendChild(node) {
        node._childIndex = this._childNodes.push(node) - 1;
        node._parent = this;
    }

    /**
     *
     * @param {Number} index
     * @param {CpeeNode} node
     */
    insertChild(index, node) {
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
    toString(displayType = CpeeNode.STRING_OPTIONS.LABEL) {
        switch (displayType) {
            case CpeeNode.STRING_OPTIONS.LABEL:
                return this.label;
            case CpeeNode.STRING_OPTIONS.LABEL_WITH_TYPE_INDEX:
                return this.label + "[" + this.typeIndex + "]";
            case CpeeNode.STRING_OPTIONS.PATH_WITH_TYPE_INDEX: {
                const strArr = this.path.map(n => n.toString(CpeeNode.STRING_OPTIONS.LABEL_WITH_TYPE_INDEX));
                return strArr.join("/");
            }
            case CpeeNode.STRING_OPTIONS.PATH: {
                const strArr = this.path.map(n => n.toString(CpeeNode.STRING_OPTIONS.LABEL));
                return strArr.join("/");
            }
            case CpeeNode.STRING_OPTIONS.CHILD_INDEX_ONLY: {
                const strArr = this.path.map(n => n.childIndex);
                return strArr.slice(1).join("/"); //drop root child index (always 0)
            }
            case CpeeNode.STRING_OPTIONS.CHANGE:
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
     * @returns {CpeeNode}
     */
    static parseFromJson(str) {
        function reviver(key, value) {
            if (value instanceof Object) {
                //all maps are marked
                if (value.dataType !== undefined  && value.dataType === "Map") {
                    return new Map(value.value);
                } else if (value.dataType !== undefined && value.dataType === "Set") {
                    return new Set(value.value);
                }
                if (value.label !== undefined) {
                    const node = new CpeeNode(value.label);
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
        return CpeeNode.parseFromJson(this.convertToJson());
    }

}

exports.CpeeNode = CpeeNode;