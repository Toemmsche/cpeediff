import {Node} from '../tree/Node.js';
import {Dsl} from '../Dsl.js';
import xmldom from 'xmldom';

/**
 * A node inside a CPEE process tree annotated with change related information.
 * This class serves as the basis for enhanced and interactive diff
 * visualization.
 *
 * @implements {XmlSerializable<DeltaNode>}
 */
export class DeltaNode extends Node {
  /** @type {String} */
  type;
  /** @type {Map<String, Update>} */
  updates;
  /** @type {Array<DeltaNode>} */
  placeholders;
  /** @type {?Number} */
  baseNode;

  /**
   * @param {String} label
   * @param {?String} text
   * @param {String} type
   * @param {?Number} baseNode The base node ID
   */
  constructor(label, text = null,
      type = Dsl.CHANGE_MODEL.NIL.label, baseNode = null) {
    super(label, text);
    this.baseNode = baseNode;
    this.type = type;
    this.updates = new Map();
    this.placeholders = [];
  }

  /**
   * Create a new DeltaNode instance from an existing node.
   * @param {Node} node
   * @param {Boolean} includeChildren
   * @return {Node}
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
    return this.type === Dsl.CHANGE_MODEL.MOVE_TO.label;
  }

  /**
   * @return {Boolean} If this node was not changed in any way regarding
   *     position or content.
   */
  isNil() {
    return this.type === Dsl.CHANGE_MODEL.NIL.label && !this.isUpdated();
  }

  /**
   * @return {Boolean} If this node was updated.
   */
  isUpdated() {
    return this.updates.size > 0;
  }

  /**
   * @return {Object} XML DOM object for this delta node and its children.
   */
  toXmlDom() {
    const doc =
        xmldom
            .DOMImplementation
            .prototype
            .createDocument(Dsl.DEFAULT_NAMESPACE);

    const prefix =
        Object
            .values(Dsl.CHANGE_MODEL)
            .find((changeType) => changeType.label === this.type)
            .prefix + ':';
    const xmlElement = doc.createElement(prefix + this.label);
    xmlElement.localName = this.label;

    // TODO delta variables
    if (this.isRoot()) {
      xmlElement.setAttribute('xmlns', Dsl.DEFAULT_NAMESPACE);
      for (const type of Object.values(Dsl.CHANGE_MODEL)) {
        xmlElement.setAttribute('xmlns:' + type.prefix, type.uri);
      }
    }

    // TODO include oldval
    for (const [key, value] of this.attributes) {
      if (this.updates.has(key)) {
        const oldVal = this.updates.get(key).oldVal;
        const newVal = this.updates.get(key).newVal;
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
              Dsl.CHANGE_MODEL.UPDATE.prefix + ':' + key,
              newVal,
          );
        }
      } else {
        xmlElement.setAttribute(key, value);
      }
    }

    for (const child of this) {
      xmlElement.appendChild(child.toXmlDom());
    }

    if (this.updates.has('text')) {
      // Text content can only be updated, not inserted or deleted
      xmlElement.setAttribute(
          Dsl.CHANGE_MODEL.UPDATE.label.prefix + ':data',
          'true',
      );
    }

    if (this.text != null && this.text !== '') {
      xmlElement.appendChild(doc.createTextNode(this.text));
    }

    return xmlElement;
  }
}


