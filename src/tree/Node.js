import {Dsl} from '../config/Dsl.js';
import {Logger} from '../util/Logger.js';
import {DomHelper} from '../util/DomHelper.js';
import xmldom from '@xmldom/xmldom';
import vkbeautify from 'vkbeautify';
import {DiffConfig} from '../config/DiffConfig.js';
import {HashExtractor} from '../extract/HashExtractor.js';

/**
 * A node inside a CPEE process tree parsed from an XML document.
 * A node is considered a(n)
 * - leaf node if it corresponds to a activity DSL-Element.
 * - inner node if it corresponds to a control flow DSL-Element.
 * - property node otherwise.
 *
 * In the case that a node is the root node, i.e. does not have a parent,
 * it is labelled as a tree in code.
 *
 * @implements {XmlSerializable<Node>}
 */
export class Node {
  /**
   * The label of this node.
   * @type {String}
   * @const
   */
  label;
  /**
   * The attributes of this node.
   * @type {Map<String, String>}
   * @const
   */
  attributes;
  /**
   * The text content of this node.
   * @type {String}
   */
  text;
  /**
   * The parent of this node, if it exists.
   * @type {?Node}
   * @protected
   */
  _parent;
  /**
   * The index of this node within the parent's ordered child list.
   * @type {?Number}
   * @protected
   */
  _index;
  /**
   * The ordered child list of this node.
   * @type {Array<Node>}
   * @protected
   */
  _children;

  /**
   * Create a new Node instance.
   * @param {String} label The label of the node.
   * @param {?String} text The text content of the node.
   */
  constructor(label, text = null) {
    this.label = label;
    this.text = text;
    this.attributes = new Map();
    this._children = [];
    this._parent = null;
    this._index = null;
  }

  /**
   * Get the parent of this node, if it exists.
   * @return {?Node}
   */
  get parent() {
    return this._parent;
  }

  /**
   * Get the index of this node within the parent's ordered child list.
   * @return {?Number}
   */
  get index() {
    return this._index;
  }

  /** @return {Array<Node>} */
  get children() {
    return this._children;
  }

  /**
   * Create a new Node instance from an existing node.
   * @param {Node} node
   * @param {Boolean} includeChildren
   * @return {Node}
   */
  static fromNode(node, includeChildren = true) {
    const copy = new Node(node.label, node.text);
    for (const [key, value] of node.attributes) {
      copy.attributes.set(key, value);
    }
    if (includeChildren) {
      for (const child of node) {
        copy.appendChild(this.fromNode(child, includeChildren));
      }
    }
    return copy;
  }

  /**
   * @param {String} xmlElement The XML DOM object.
   * @param {Boolean} includeChildren Whether to include children.
   * @return {Node}
   */
  static fromXmlDom(xmlElement, includeChildren = true) {
    const node = new Node(xmlElement.localName);
    // parse attributes
    for (let i = 0; i < xmlElement.attributes.length; i++) {
      const attrNode = xmlElement.attributes.item(i);
      node.attributes.set(attrNode.name, attrNode.value);
    }

    for (let i = 0; i < xmlElement.childNodes.length; i++) {
      const childElement = xmlElement.childNodes.item(i);
      if (childElement.nodeType === DomHelper.XML_NODE_TYPES.TEXT) {
        // check if text node contains a non-empty payload
        if (childElement.data.match(/^\s*$/) == null) {
          if (node.text == null) {
            node.text = '';
          }
          node.text += childElement.data;
        }
      } else if (childElement.nodeType === DomHelper.XML_NODE_TYPES.ELEMENT &&
          includeChildren) {
        node.appendChild(this.fromXmlDom(childElement, includeChildren));
      }
    }
    return node;
  }

  /**
   * @param {String} xml The XML document.
   * @param {Boolean} includeChildren Whether to include children.
   * @return {Node}
   */
  static fromXmlString(xml, includeChildren = true) {
    return this.fromXmlDom(DomHelper.firstChildElement(
        new xmldom
            .DOMParser()
            .parseFromString(xml, 'text/xml')), includeChildren);
  }

  /**
   * @return {IterableIterator<Node>} An iterator for this node's children
   */
  [Symbol.iterator]() {
    return this._children[Symbol.iterator]();
  }

  /** @param {Node} node */
  appendChild(node) {
    node._index = this._children.push(node) - 1;
    node._parent = this;
  }

  /**
   * Move this node to a new position within the child list of its parent.
   * @param {Number} index The new index.
   */
  changeIndex(index) {
    // delete
    this._parent._children.splice(this._index, 1);
    // insert
    this._parent._children.splice(index, 0, this);
    // adjust indices of all children
    this._parent.#fixChildIndices();
  }

  /**
   * Determines if the content of this node is equal to the content
   * of another node.
   * @param {Node} other
   * @return {Boolean} True, iff the content equals.
   */
  contentEquals(other) {
    return this.label === other.label &&
        this.text === other.text &&
        this.attributes.size === other.attributes.size &&
        ![...this.attributes.entries()]
            .some((entry) => other.attributes.get(entry[0]) !== entry[1]);
  }

  /**
   * @return {Number} The number of children of this node
   */
  degree() {
    return this._children.length;
  }

  /**
   * Fina a node in the sutree rooted at this node based on its index path.
   * @param {String} indexPath The index path of the node.
   * @return {Node}
   */
  findNode(indexPath) {
    let currNode = this;
    if (indexPath !== '') {
      for (const index of indexPath.split('/').map((str) => parseInt(str))) {
        if (index >= currNode.degree()) {
          Logger.error('Invalid index path', this);
        }
        currNode = currNode.getChild(index);
      }
    }
    return currNode;
  }

  /**
   * Restore the correct indices of all children.
   * @private
   */
  #fixChildIndices() {
    this._children.forEach((node, index) => node._index = index);
  }

  /**
   * @param {Number} index
   * @return {Node}
   */
  getChild(index) {
    return this._children[index];
  }

  /** @return {?Node} */
  getLeftSibling() {
    return this._index > 0 ?
           this.getSiblings()[this._index - 1] :
           null;
  }

  /** @return {?Node} */
  getRightSibling() {
    return this._index < this.getSiblings().length - 1 ?
           this.getSiblings()[this._index + 1] :
           null;
  }

  /** @return {?Array<Node>} The child list of the parent node */
  getSiblings() {
    return this._parent._children;
  }

  /** @return {Boolean} */
  hasAttributes() {
    return this.attributes.size > 0;
  }

  /** @return {Boolean} */
  hasChildren() {
    return this.degree() > 0;
  }

  /**
   * NOTE: It is known that property nodes of inner nodes are still considered
   * ordered by this function. This is fine for our purposes and unlikely to
   * ever make a difference in reality.
   * @return {Boolean} If the order of the children of this node
   * has semantic implications in terms of the CPEE DSL.
   */
  hasInternalOrdering() {
    if (this.isPropertyNode()) {
      return this.isCallArguments();
    } else if (this.isLeaf()) {
      // Property nodes of leaves are never ordered
      return false;
    } else {
      return !this.isParallel();
    }
  }

  /** @return {Boolean} */
  hasText() {
    return this.text != null && this.text !== '';
  }

  /**
   * Test for subtree hash equality with another subtree.
   * @param {Node} other The root of the other subtree.
   * @return {Boolean} True, iff their hashes equal.
   */
  hashEquals(other) {
    const hashExtractor = new HashExtractor();
    return hashExtractor.get(this) === hashExtractor.get(other);
  }

  /** @return {Array<Node>} All inner nodes of this subtree in pre-order */
  inners() {
    return this
        .toPreOrderArray()
        .filter((n) => n.isInnerNode());
  }

  /**
   * @param {Number} index The position at which to insert the new child.
   * @param {Node} node The new child.
   */
  insertChild(index, node) {
    this._children.splice(index, 0, node);
    node._parent = this;
    this.#fixChildIndices();
  }

  /** @return {Boolean} */
  isAlternative() {
    return this.label === Dsl.ELEMENTS.ALTERNATIVE.label &&
        !this._parent?.isCallArguments();
  }

  /** @return {Boolean} */
  isBreak() {
    return this.label === Dsl.ELEMENTS.BREAK.label &&
        !this._parent?.isCallArguments();
  }

  /** @return {Boolean} */
  isCall() {
    return this.label === Dsl.ELEMENTS.CALL.label &&
        !this._parent?.isCallArguments();
  }

  /** @return {Boolean} */
  isCallArguments() {
    return this.label === Dsl.CALL_PROPERTIES.ARGUMENTS.label &&
        this._parent.label !== Dsl.CALL_PROPERTIES.ARGUMENTS.label;
  }

  /** @return {Boolean} */
  isCallLabel() {
    return this.label === Dsl.CALL_PROPERTIES.LABEL.label &&
        !this._parent?.isCallArguments();
  }

  /** @return {Boolean} */
  isCallMethod() {
    return this.label === Dsl.CALL_PROPERTIES.METHOD.label &&
        !this._parent?.isCallArguments();
  }

  /** @return {Boolean} */
  isChoice() {
    return this.label === Dsl.ELEMENTS.CHOICE.label &&
        !this._parent?.isCallArguments();
  }

  /** @return {Boolean} */
  isCritical() {
    return this.label === Dsl.ELEMENTS.CRITICAL.label &&
        !this._parent?.isCallArguments();
  }

  /** @return {Boolean} */
  isEmpty() {
    if (this.isInnerNode()) {
      return !this.isRoot() && !this.hasChildren();
    } else if (this.isLeaf()) {
      return this.isScript() && (this.text === '' || this.text == null);
    } else {
      // Property node
      return !this.hasChildren() && (this.text === '' || this.text == null);
    }
  }

  /**
   * @return {Boolean} If this node corresponds to a control flow DSL-Element
   * in terms of the CPEE DSL {@see Dsl}.
   */
  isInnerNode() {
    return Dsl.INNER_NODE_SET.has(this.label) &&
        !this._parent?.isCallArguments(); // root may be checked
  }

  /** @return {Boolean} */
  isInnterruptLeafNode() {
    return this.isTermination() || this.isStop() || this.isBreak();
  }

  /**
   * @return {Boolean} If this node corresponds to an activity DSL-Element
   * in terms of the CPEE DSL {@see Dsl}.
   */
  isLeaf() {
    return Dsl.LEAF_NODE_SET.has(this.label) &&
        !this._parent?.isCallArguments();
  }

  /** @return {Boolean} */
  isLoop() {
    return this.label === Dsl.ELEMENTS.LOOP.label &&
        !this._parent?.isCallArguments();
  }

  /** @return {Boolean} */
  isOtherwise() {
    return this.label === Dsl.ELEMENTS.OTHERWISE.label &&
        !this._parent?.isCallArguments();
  }

  /** @return {Boolean} */
  isParallel() {
    return this.label === Dsl.ELEMENTS.PARALLEL.label &&
        !this._parent?.isCallArguments();
  }

  /** @return {Boolean} */
  isParallelBranch() {
    return this.label === Dsl.ELEMENTS.PARALLEL_BRANCH.label &&
        !this._parent?.isCallArguments();
  }

  /**
   * @return {Boolean} If this node corresponds to a property
   * in terms of the CPEE DSL {@see Dsl}.
   */
  isPropertyNode() {
    // Call arguments that are named after DSL-elements
    // can break the first condition.
    return !Dsl.ELEMENT_SET.has(this.label) ||
        this._parent?.isCallArguments();
  }

  /** @return {Boolean} */
  isRoot() {
    return this.label === Dsl.ELEMENTS.DSL_ROOT.label && this._parent == null;
  }

  /** @return {Boolean} */
  isScript() {
    return this.label === Dsl.ELEMENTS.SCRIPT.label &&
        !this._parent?.isCallArguments();
  }

  /** @return {Boolean} */
  isStop() {
    return this.label === Dsl.ELEMENTS.STOP.label &&
        !this._parent?.isCallArguments();
  }

  /** @return {Boolean} */
  isTermination() {
    return this.label === Dsl.ELEMENTS.TERMINATION.label &&
        !this._parent?.isCallArguments();
  }

  /** @return {Array<Node>} All leaf nodes of this subtree in pre-order */
  leaves() {
    return this
        .toPreOrderArray()
        .filter((n) => n.isLeaf());
  }

  /** @return {Array<Node>} All property nodes of this subtree in pre-order */
  nonPropertyNodes() {
    return this
        .toPreOrderArray()
        .filter((n) => !n.isPropertyNode());
  }

  /**
   * Compute a subsequence of this node's path.
   * The path is the sequence of all ancestors of this node,
   * starting from the root (inclusive) to this node (inclusive).
   * @param {?Number} limit The maximum length of the subsequence,
   *   unlimited if null.
   * @return {Array<Node>} The subsequence of the path.
   */
  path(limit = null) {
    const pathArr = [];
    let node = this;
    while (node != null && (limit == null || pathArr.length < limit)) {
      pathArr.push(node);
      node = node._parent;
    }
    // this node is always last in path
    return pathArr.reverse();
  }

  /**
   * Remove a node from the child list of its parent.
   * Note: The parent attribute is not cleared by this function.
   */
  removeFromParent() {
    if (this._parent != null) {
      this._parent.children.splice(this._index, 1);
      this._parent.#fixChildIndices();
    } else {
      // Unexpected, but non-fatal event
      Logger.warn('Removing node ' +
          this.toString() + ' that has no parent', this);
    }
  }

  /**
   * Warning: This function takes O(n) time!
   * @return {number} The size of the subtree rooted at this node.
   */
  size() {
    return this.toPreOrderArray().length;
  }

  /**
   * Create a list of all nodes contained in the subtree rooted at this node
   * in post-order.
   * @param {Array<Node>} arr Helper array for performance reasons.
   * @return {Array<Node>}
   */
  toPostOrderArray(arr = []) {
    for (const child of this) {
      child.toPostOrderArray(arr);
    }
    arr.push(this);
    return arr;
  }

  /**
   * Create a list of all nodes contained in the subtree rooted at this node
   * in pre-order.
   * @param {Array<Node>} arr Helper array for performance reasons.
   * @return {Array<Node>}
   */
  toPreOrderArray(arr = []) {
    arr.push(this);
    for (const child of this) {
      child.toPreOrderArray(arr);
    }
    return arr;
  }

  /**
   * @param {Object} ownerDocument The owner document of the generated XML
   *     element.
   * @return {Object} XML DOM object for this node and its children.
   */
  toXmlDom(ownerDocument = xmldom
      .DOMImplementation
      .prototype
      .createDocument(Dsl.DEFAULT_NAMESPACE)) {
    const xmlElement = ownerDocument.createElement(this.label);
    if (this.isRoot()) {
      xmlElement.setAttribute('xmlns', Dsl.DEFAULT_NAMESPACE);
    }
    for (const [key, value] of this.attributes) {
      xmlElement.setAttribute(key, value);
    }

    for (const child of this) {
      xmlElement.appendChild(child.toXmlDom(ownerDocument));
    }

    if (this.text != null) {
      xmlElement.appendChild(ownerDocument.createTextNode(this.text));
    }

    return xmlElement;
  }

  /**
   * @return {String} XML document of this node and its children.
   */
  toXmlString() {
    const xml = new xmldom.XMLSerializer().serializeToString(this.toXmlDom());
    if (DiffConfig.PRETTY_XML) {
      return vkbeautify.xml(xml);
    } else {
      return xml;
    }
  }

  /**
   * Returns the an XPath like positional identifier for this node.
   * @return {String} The array of indices of all nodes on the path
   *     excluding the root.
   */
  xPath() {
    // discard root node
    return this.path()
        .slice(1)
        .map((node) => node.index)
        .join('/');
  }
}

