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

import {Dsl} from "../Dsl.js";
import {Logger} from "../../Logger.js";

/**
 * A node inside a CPEE process tree parsed from an XML document.
 * Process trees are rooted trees that are ordered and labeled.
 * Additionally, each node can have optinal attributes and text content.
 *
 * A node is either a leaf node if it corresponds to a leaf element in the CPEE DSL {@see Dsl},
 * an inner node if it corresponds to an inner element in the CPEE DSL {@see Dsl}
 * or a property node otherwise. Property nodes describe the content of their closes non-property node ancestor
 * in more detail, although their content does NOT contribute to the text content of their logical parent.
 * @property {String} label The label of the node, equivalent to the XML tag
 * @property {Map<String, String>} attributes The attributes of the node as key-value pairs
 * @property {String} text The text content of the node
 */
export class Node {

    /*
    Node Content
     */

    label;
    attributes;
    text;


    /**
     * Construct a new node with the given label and text content and an empty attribute map.
     * @param {String} label The label of the node
     * @param {String} text  The content of the node
     */
    constructor(label, text = null) {
        this.label = label;
        this.text = text;
        this.attributes = new Map();
        this._children = [];
        this._parent = null;
        this._childIndex = null;
    }

    /*
    Structural Information
     */

    /**
     * The parent node of this node. Null if this is the root node.
     * @type Node|null
     * @private
     */
    _parent;

    /**
     * @returns {Node|null} The parent node of this node.
     */
    get parent() {
        return this._parent;
    }

    /**
     * The index of this node within the parent's ordered child list. Null if this is the root node.
     * @type Number|null
     * @private
     */
    _childIndex;

    /**
     * @returns {Number|null} The index of this node within the parent's ordered child list.
     */
    get childIndex() {
        return this._childIndex;
    }

    /**
     * The ordered array of the children of this node.
     * @type Node[]
     * @private
     */
    _children;

    /**
     * @returns {Node[]} The ordered array of children of this node.
     */
    get children() {
        return this._children;
    }

    /**
     * Returns all nodes that lie on the path from this node (inclusive) to the root (exclusive).
     * @returns {Node[]} The array of all nodes on this node's path.
     */
    get path() {
        const pathArr = [];
        let node = this;
        while (node != null) {
            pathArr.push(node);
            node = node._parent;
        }
        //exclude root
        return pathArr.reverse().slice(1);
    }

    /**
     * @returns {IterableIterator<Node>} An iterator for the children of this node.
     */
    [Symbol.iterator]() {
        return this._children[Symbol.iterator]();
    }

    /**
     * @returns {number} The number of children of this node.
     */
    degree() {
        return this._children.length;
    }

    /**
     * @param index The index of the desired child of this node.
     * @returns {Node|null} The child at the desired index, if it exists.
     */
    getChild(index) {
        return this._children[index];
    }

    /**
     * @returns {Node[]} The child list of the parent node.
     */
    getSiblings() {
        return this._parent._children;
    }

    /**
     * @returns {Node|null} The sibling node with the next lower child index, if it exists.
     */
    getLeftSibling() {
        if (this._childIndex > 0) {
            return this.getSiblings()[this._childIndex - 1];
        }
        return null;
    }

    /**
     * @returns {Node|null} The sibling node with the next higher child index, if it exists.
     */
    getRightSibling() {
        if (this._childIndex < this.getSiblings().length - 1) {
            return this.getSiblings()[this._childIndex + 1];
        }
        return null;
    }

    /**
     * Determines if the content (label, attributes and text) of this node is equal to the content
     * of another node.
     * @param {Node} other The other node to compare against.
     * @returns {Boolean} If the content equals.
     */
    contentEquals(other) {
        if (this.label !== other.label) return false;
        if (this.attributes.size !== other.attributes.size) return false;
        for (const [key, value] of this.attributes) {
            if (other.attributes.get(key) !== value) return false;
        }
        if (this.text !== other.text) return false;
        return true;
    }

    /**
     * @returns {boolean} If this node has at least one child.
     */
    hasChildren() {
        return this.degree() > 0;
    }

    /**
     * @returns {boolean} If this node has at least one attribute.
     */
    hasAttributes() {
        return this.attributes.size > 0
    }

    /**
     * @returns {boolean} If the order of the children of this node
     *                    has semantic implications in terms of the CPEE DSL {@see Dsl}.
     */
    hasInternalOrdering() {
        return Dsl.INTERNAL_ORDERING_SET.has(this.label);
    }

    /**
     * @returns {boolean} If this node corresponds to a leaf element in terms of the CPEE DSL {@see Dsl}.
     */
    isLeaf() {
        return Dsl.LEAF_NODE_SET.has(this.label);
    }

    /**
     * @returns {boolean} If this node corresponds to an inner element in terms of the CPEE DSL {@see Dsl}.
     */
    isInnerNode() {
        return Dsl.INNER_NODE_SET.has(this.label);
    }

    /**
     * @returns {boolean} If this node corresponds to a property in terms of the CPEE DSL {@see Dsl}.
     */
    isPropertyNode() {
        return !Dsl.ELEMENT_SET.has(this.label) || this._parent?.isPropertyNode();
    }

    /**
     * @returns {boolean} If this node is the root node of the process tree it is a part of.
     */
    isRoot() {
        return this.label === Dsl.ELEMENTS.ROOT.label && this._parent == null;
    }

    /**
     * @returns {boolean} If this node does not have any content.
     */
    isEmpty() {
        return !this.isLeaf()
            && (this.text === "" || this.text == null)
            && !this.hasAttributes()
            && !this.hasChildren();
    }

    /**
     * Append a node at the end of the child list.
     * @param {Node} node The node to append.
     */
    appendChild(node) {
        node._childIndex = this._children.push(node) - 1;
        node._parent = this;
    }

    /**
     * Insert a child at a specified position within the child list.
     * @param {Number} index The position at which to insert the node.
     * @param {Node} node The node to insert.
     */
    insertChild(index, node) {
        this._children.splice(index, 0, node);
        node._parent = this;
        this._fixChildIndices();
    }

    /**
     * Move this node to a new position within the child list of its parent.
     * Afterwards, the child index should equal the specified index.
     * @param {Number} newIndex The new child index.
     */
    changeChildIndex(newIndex) {
        //The node currently residing at position newIndex will be pushed back, no matter what.
        if (newIndex > this._childIndex) {
            newIndex--;
        }
        //delete
        this._parent._children.splice(this._childIndex, 1);
        //insert
        this._parent._children.splice(newIndex, 0, this);
        //adjust child indices
        this._parent._fixChildIndices();
    }

    /**
     * Remove a node from the child list of its parent.
     * Note: The parent attribute is not cleared by this function.
     */
    removeFromParent() {
        if (this._parent != null) {
            this._parent.children.splice(this._childIndex, 1);
            this._parent._fixChildIndices();
        } else {
            Logger.warn("Removing node " + this.toString() + " that has no parent", this);
        }

    }

    /**
     * Restore the correct child indices of all children.
     * @private
     */
    _fixChildIndices() {
        for (let i = 0; i < this._children.length; i++) {
            this._children[i]._childIndex = i;
        }
    }

    /**
     * Returns the child index of each node in the path from this node (inclusive) to the root (exclusive).
     * @returns {string} The array of child indices of all nodes on the path.
     */
    toChildIndexPathString() {
        //discard root node
        return this.path.map(n => n.childIndex).join("/");
    }

    //TODO
    toString() {
        return this.label;
    }

    /**
     * Traverses the subtree rooted at this node in pre-order and appends all visited nodes to a given array.
     * @param {Node[]} arr The target array. Defaults to an empty array.
     * @returns {Node[]} The target array containing all nodes of this subtree in pre-order.
     */
    toPreOrderArray(arr = []) {
        arr.push(this);
        for (const child of this) {
            child.toPreOrderArray(arr);
        }
        return arr;
    }

    /**
     * Traverses the subtree rooted at this node in post-order and appends all visited nodes to a given array.
     * @param {Node[]} arr The target array. Defaults to an empty array.
     * @returns {Node[]} The target array containing all nodes of this subtree in post-order.
     */
    toPostOrderArray(arr = []) {
        for (const child of this) {
            child.toPostOrderArray(arr);
        }
        arr.push(this);
        return arr;
    }

    /**
     * Returns all nodes of the subtree rooted at this node that correspond to an inner node in terms
     * of the CPEE DSL {@see Dsl}. The nodes are visited in pre-order.
     * @returns {Node[]} All inner nodes of this subtree in pre-order.
     */
    innerNodes() {
        return this.toPreOrderArray()
            .filter(n => n.isInnerNode());
    }

    /**
     * Returns all nodes of the subtree rooted at this node that correspond to a leaf node in terms
     * of the CPEE DSL {@see Dsl}. The nodes are visited in pre-order.
     * @returns {Node[]} All leaf nodes of this subtree in pre-order.
     */
    leaves() {
        return this.toPreOrderArray()
            .filter(n => n.isLeaf());
    }

    /**
     * Returns all nodes of the subtree rooted at this node that do NOT correspond to a property in terms
     * of the CPEE DSL {@see Dsl}. The nodes are visited in pre-order.
     * @returns {Node[]} All non-property nodes of this subtree in pre-order.
     */
    nonPropertyNodes() {
        return this.toPreOrderArray()
            .filter(n => !n.isPropertyNode());
    }

    /**
     * Warning: This function takes O(n) time!
     * @returns {number} The size of the subtree rooted at this node.
     */
    size() {
        return this.toPostOrderArray().length;
    }
}

