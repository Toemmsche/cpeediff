import {Node} from '../../tree/Node.js';
import {Dsl} from '../../config/Dsl.js';
import xmldom from '@xmldom/xmldom';

/**
 * A node inside a CPEE process tree annotated with change related information.
 * This class serves as the basis for diff visualization as well as merging.
 *
 * @implements {XmlSerializable<DeltaNode>}
 * @extends {Node}
 */
export class DeltaNode extends Node {
  /**
   * The type of change this node was affected by.
   * @type {String}
   */
  type;
  /**
   * The updates applied to the attributes and text content of this node.
   * @type {Map<String, Update>}
   * @const
   */
  updates;
  /**
   * Placeholder children of this node that were deleted or moved away.
   * @type {Array<DeltaNode>}
   * @const
   */
  placeholders;
  /**
   * The ID of the node in the base tree, if it exists, that this node
   * corresponds to. Null indicates an inserted node
   * @type {?Number}
   */
  baseNode;

  /**
   * Construct a new DeltaNode instance.
   * @param {String} label The label of the node.
   * @param {?String} text The text content of the node.
   * @param {String} type The type of change this node was affected by.
   * @param {?Number} baseNode The base node ID.
   */
  constructor(
      label,
      text = null,
      type = Dsl.CHANGE_MODEL.NIL.label,
      baseNode = null,
  ) {
    super(label, text);
    this.baseNode = baseNode;
    this.type = type;
    this.updates = new Map();
    this.placeholders = [];
  }

  /**
   * Insert a new child and adjust placeholder indices.
   * @param {Number} index The position at which to insert the new child.
   * @param {Node} node The new child.
   * @override
   */
  insertChild(index, node) {
    super.insertChild(index, node);
    // Adjust placeholders
    for (const placeholder of this.placeholders) {
      if (placeholder._index >= index) {
        placeholder._index++;
      }
    }
  }

  /**
   * Remove a node from the child list of its parent. Also adjust the indices
   * of all placeholders. Note: The parent attribute is not cleared by this
   * function.
   * @override
   */
  removeFromParent() {
    super.removeFromParent();
    if (this._parent != null) {
      for (const placeholder of this._parent.placeholders) {
        if (placeholder._index > this.index) {
          placeholder._index--;
        }
      }
    }
  }

  /**
   * @param {Object} ownerDocument The owner document of the generated XML
   *     element.
   * @return {Object} XML DOM object for this delta node and its children.
   * @override
   */
  toXmlDom(ownerDocument = xmldom
      .DOMImplementation
      .prototype
      .createDocument(Dsl.DEFAULT_NAMESPACE)) {
    const prefix =
        Object
            .values(Dsl.CHANGE_MODEL)
            .find((changeType) => changeType.label === this.type)
            .prefix + ':';
    const xmlElement = ownerDocument.createElement(prefix + this.label);
    xmlElement.localName = this.label;

    if (this.isMoved() || this.isMovedFrom()) {
      xmlElement.setAttribute(prefix + 'move_id', this.baseNode);
    }

    if (this.isRoot()) {
      xmlElement.setAttribute('xmlns', Dsl.DEFAULT_NAMESPACE);
      for (const type of Object.values(Dsl.CHANGE_MODEL)) {
        xmlElement.setAttribute('xmlns:' + type.prefix, type.uri);
      }
    }

    // Append regular attributes
    for (const [key, value] of this.attributes) {
      if (!this.updates.has(key)) {
        xmlElement.setAttribute(key, value);
      }
    }

    // Append updated attributes
    for (const [key, update] of this.updates) {
      const oldVal = update.oldVal;
      const newVal = update.newVal;
      if (oldVal == null) {
        xmlElement.setAttribute(
            Dsl.CHANGE_MODEL.INSERTION.prefix + ':' + key,
            newVal,
        );
      } else if (newVal == null) {
        xmlElement.setAttribute(
            Dsl.CHANGE_MODEL.DELETION.prefix + ':' + key,
            oldVal,
        );
      } else {
        xmlElement.setAttribute(
            Dsl.CHANGE_MODEL.UPDATE_FROM.prefix + ':' + key,
            oldVal,
        );
        xmlElement.setAttribute(
            Dsl.CHANGE_MODEL.UPDATE.prefix + ':' + key,
            newVal,
        );
      }
    }

    const textKey = 'text';
    // Changes in text content are also modelled as updates
    if (this.updates.has(textKey)) {
      const oldVal = this.updates.get(textKey).oldVal;
      const newVal = this.updates.get(textKey).newVal;
      if (oldVal == null) {
        xmlElement.setAttribute(
            Dsl.CHANGE_MODEL.INSERTION.prefix + ':' + textKey,
            'true',
        );
      } else if (newVal == null) {
        xmlElement.setAttribute(
            Dsl.CHANGE_MODEL.DELETION.prefix + ':' + textKey,
            'true',
        );
      } else {
        xmlElement.setAttribute(
            Dsl.CHANGE_MODEL.UPDATE_FROM.prefix + ':' + textKey,
            oldVal,
        );
        xmlElement.setAttribute(
            Dsl.CHANGE_MODEL.UPDATE.prefix + ':' + textKey,
            'true',
        );
      }
    }

    if (this.hasText()) {
      xmlElement.appendChild(ownerDocument.createTextNode(this.text));
    }

    for (const child of this) {
      xmlElement.appendChild(child.toXmlDom(ownerDocument));
    }

    return xmlElement;
  }

  /**
   * Create a new DeltaNode instance from an existing node.
   * @param {Node} node
   * @param {Boolean} includeChildren
   * @return {DeltaNode}
   * @override
   */
  static fromNode(node, includeChildren) {
    const deltaNode = new DeltaNode(node.label, node.text);
    for (const [key, value] of node.attributes) {
      deltaNode.attributes.set(key, value);
    }
    if (includeChildren) {
      for (const child of node) {
        deltaNode.appendChild(this.fromNode(child, includeChildren));
      }
    }
    if (node instanceof DeltaNode) {
      deltaNode.type = node.type;
      deltaNode.baseNode = node.baseNode;
      for (const placeholder of node.placeholders) {
        deltaNode.placeholders.push(this.fromNode(placeholder, true));
      }
      for (const [key, update] of node.updates) {
        deltaNode.updates.set(key, update.copy());
      }
    }
    return deltaNode;
  }

  /**
   * @return {Boolean} If this node was deleted.
   */
  isDeleted() {
    return this.type === Dsl.CHANGE_MODEL.DELETION.label;
  }

  /**
   * @return {Boolean} If this node was inserted.
   */
  isInserted() {
    return this.type === Dsl.CHANGE_MODEL.INSERTION.label;
  }

  /**
   * @return {Boolean} If this node was moved.
   */
  isMoved() {
    return this.type === Dsl.CHANGE_MODEL.MOVE.label;
  }

  /**
   * @return {Boolean} If this node is a placeholder for a moved node before it
   *     was moved.
   */
  isMovedFrom() {
    return this.type === Dsl.CHANGE_MODEL.MOVE_FROM.label;
  }

  /**
   * @return {Boolean} If this node was deleted or moved away
   */
  isPlaceholder() {
    return this.isMovedFrom() || this.isDeleted();
  }

  /**
   * @return {Boolean} If this node was not changed in any way regarding
   *     position or content.
   */
  isUnchanged() {
    return this.type === Dsl.CHANGE_MODEL.NIL.label && !this.isUpdated();
  }

  /**
   * @return {Boolean} If this node was updated.
   */
  isUpdated() {
    return this.updates.size > 0;
  }
}


