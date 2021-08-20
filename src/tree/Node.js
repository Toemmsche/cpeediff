import {Dsl} from '../Dsl.js';
import {Logger} from '../../util/Logger.js';
import {DomHelper} from '../../util/DomHelper.js';
import xmldom from 'xmldom';

/**
 * A node inside a CPEE process tree parsed from an XML document.
 * A node is considered a(n)
 * - leaf node if it corresponds to a activity DSL-Element.
 * - inner node if it corresponds to a control flow DSL-Element.
 * - property node otherwise.
 *
 * In the case that a node is the root node, i.e. does not have a parent,
 * it is labelled as a tree in code.
 */
export class Node {
  /** @type {String} */
  label;
  /** @type {Map<String, String>} */
  attributes;
  /** @type {?String} */
  text;

  /**
   * @param {String} label
   * @param {?String} text
   */
  constructor(label, text = null) {
    this.label = label;
    this.text = text;
    this.attributes = new Map();
    this.#children = [];
    this.#parent = null;
    this.#index = null;
  }

  /**
   * @type {?Node}
   * @private
   */
  #parent;

  /** @return {?Node} */
  get parent() {
    return this.#parent;
  }

  /**
   * The index of this node within the parent's ordered child list.
   * @type {?Number}
   * @private
   */
  #index;

  /** @return {?Number} */
  get index() {
    return this.#index;
  }

  /**
   * @type {Array<Node>}
   * @private
   */
  #children;

  /** @return {Array<Node>} */
  get children() {
    return this.#children;
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
   * Create a new Node instance from an XML string or xmldom object.
   * @param {String|Object} xmlElement
   * @param {Boolean} includeChildren
   * @return {Node}
   */
  static fromXml(xmlElement, includeChildren = true) {
    if (xmlElement.constructor === String) {
      xmlElement = DomHelper.firstChildElement(
          new xmldom
              .DOMParser()
              .parseFromString(xmlElement, 'text/xml'));
    }
    const root = new Node(xmlElement.localName);
    // parse attributes
    for (let i = 0; i < xmlElement.attributes.length; i++) {
      const attrNode = xmlElement.attributes.item(i);
      root.attributes.set(attrNode.name, attrNode.value);
    }

    for (let i = 0; i < xmlElement.childNodes.length; i++) {
      const childElement = xmlElement.childNodes.item(i);
      if (childElement.nodeType === DomHelper.XML_NODE_TYPES.TEXT) {
        // check if text node contains a non-empty payload
        if (childElement.data.match(/^\s*$/) == null) {
          if (root.text == null) {
            root.text = '';
          }
          root.text += childElement.data;
        }
      } else if (childElement.nodeType === DomHelper.XML_NODE_TYPES.ELEMENT &&
          includeChildren) {
        root.appendChild(this.fromXml(childElement, includeChildren));
      }
    }
    return root;
  }

  /**
   * @return {IterableIterator<Node>} An iterator for this node's children
   */
  [Symbol.iterator]() {
    return this.#children[Symbol.iterator]();
  }

  /** @param {Node} node */
  appendChild(node) {
    node.#index = this.#children.push(node) - 1;
    node.#parent = this;
  }

  /**
   * Move this node to a new position within the child list of its parent.
   * @param {Number} index The new index.
   */
  changeIndex(index) {
    // delete
    this.#parent.#children.splice(this.#index, 1);
    // insert
    this.#parent.#children.splice(index, 0, this);
    // adjust indices of all children
    this.#parent.#fixChildIndices();
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
    return this.#children.length;
  }

  /**
   * Restore the correct indices of all children.
   * @private
   */
  #fixChildIndices() {
    this.#children.forEach((node, index) => node.#index = index);
  }

  /**
   * @param {Number} index
   * @return {Node}
   */
  getChild(index) {
    return this.#children[index];
  }

  /** @return {?Node} */
  getLeftSibling() {
    return this.#index > 0 ?
           this.getSiblings()[this.#index - 1] :
           null;
  }

  /** @return {?Node} */
  getRightSibling() {
    return this.#index < this.getSiblings().length - 1 ?
           this.getSiblings()[this.#index + 1] :
           null;
  }

  /** @return {?Array<Node>} The child list of the parent node */
  getSiblings() {
    return this.#parent.#children;
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
   * @return {Boolean} If the order of the children of this node
   * has semantic implications in terms of the CPEE DSL.
   */
  hasInternalOrdering() {
    return Dsl.INTERNAL_ORDERING_SET.has(this.label);
  }

  /** @return {Array<Node>} All inner nodes of this subtree in pre-order */
  innerNodes() {
    return this
        .toPreOrderArray()
        .filter((n) => n.isInnerNode());
  }

  /**
   * @param {Number} index
   * @param {Node} node
   */
  insertChild(index, node) {
    this.#children.splice(index, 0, node);
    node.#parent = this;
    this.#fixChildIndices();
  }

  /** @return {Boolean} */
  isAlternative() {
    return this.label === Dsl.ELEMENTS.ALTERNATIVE.label &&
        !this.#parent.isPropertyNode();
  }

  /** @return {Boolean} */
  isBreak() {
    return this.label === Dsl.ELEMENTS.ESCAPE.label &&
        !this.#parent.isPropertyNode();
  }

  /** @return {Boolean} */
  isCall() {
    return this.label === Dsl.ELEMENTS.CALL.label &&
        !this.#parent.isPropertyNode();
  }

  /** @return {Boolean} */
  isChoice() {
    return this.label === Dsl.ELEMENTS.CHOOSE.label &&
        !this.#parent.isPropertyNode();
  }

  /** @return {Boolean} */
  isCritical() {
    return this.label === Dsl.ELEMENTS.CRITICAL.label &&
        !this.#parent.isPropertyNode();
  }

  /** @return {Boolean} */
  isEmpty() {
    return !this.isInnterruptLeafNode() &&
        (this.text === '' || this.text == null) &&
        !this.hasAttributes() &&
        !this.hasChildren();
  }

  /**
   * @return {Boolean} If this node corresponds to a control flow DSL-Element
   * in terms of the CPEE DSL {@see Dsl}.
   */
  isInnerNode() {
    return !this.isPropertyNode() && Dsl.INNER_NODE_SET.has(this.label);
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
    return !this.isPropertyNode() && Dsl.LEAF_NODE_SET.has(this.label);
  }

  /** @return {Boolean} */
  isLoop() {
    return this.label === Dsl.ELEMENTS.LOOP.label &&
        !this.#parent.isPropertyNode();
  }

  /** @return {Boolean} */
  isOtherwise() {
    return this.label === Dsl.ELEMENTS.OTHERWISE.label &&
        !this.#parent.isPropertyNode();
  }

  /** @return {Boolean} */
  isParallel() {
    return this.label === Dsl.ELEMENTS.PARALLEL.label &&
        !this.#parent.isPropertyNode();
  }

  /** @return {Boolean} */
  isParallelBranch() {
    return this.label === Dsl.ELEMENTS.PARALLEL_BRANCH.label &&
        !this.#parent.isPropertyNode();
  }

  /**
   * @return {Boolean} If this node corresponds to a property
   * in terms of the CPEE DSL {@see Dsl}.
   */
  isPropertyNode() {
    // Call arguments that are named after DSL-elements
    // can break the first condition.
    return !Dsl.ELEMENT_SET.has(this.label) ||
        (this.#parent != null && !Dsl.ELEMENT_SET.has(this.#parent.label));
  }

  /** @return {Boolean} */
  isRoot() {
    return this.label === Dsl.ELEMENTS.ROOT.label && this.#parent == null;
  }

  /** @return {Boolean} */
  isScript() {
    return this.label === Dsl.ELEMENTS.MANIPULATE.label &&
        !this.#parent.isPropertyNode();
  }

  /** @return {Boolean} */
  isStop() {
    return this.label === Dsl.ELEMENTS.STOP.label &&
        !this.#parent.isPropertyNode();
  }

  /** @return {Boolean} */
  isTermination() {
    return this.label === Dsl.ELEMENTS.TERMINATE.label &&
        !this.#parent.isPropertyNode();
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
      node = node.#parent;
    }
    // this node is always last in path
    return pathArr.reverse();
  }

  /**
   * Remove a node from the child list of its parent.
   * Note: The parent attribute is not cleared by this function.
   */
  removeFromParent() {
    if (this.#parent != null) {
      this.#parent.children.splice(this.#index, 1);
      this.#parent.#fixChildIndices();
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
    return this
        .#children
        .reduce((acc, child) => acc + child.size(), 1);
  }

  /**
   * Create a list of all nodes contained in the subtree rooted at this node
   * in post-order.
   * @return {Array<Node>}
   */
  toPostOrderArray() {
    return this
        .#children
        .map((child) => child.toPreOrderArray())
        .reduce((arr1, arr2) => arr1.concat(arr2), [])
        .concat([this]);
  }

  /**
   * Create a list of all nodes contained in the subtree rooted at this node
   * in pre-order.
   * @return {Array<Node>}
   */
  toPreOrderArray() {
    const arr = [this].concat(
        this
            .#children
            .map((child) => child.toPreOrderArray())
            .reduce((arr1, arr2) => arr1.concat(arr2), []));
    return arr;
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

