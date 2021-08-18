import {Node} from '../tree/Node.js';
import {Dsl} from '../Dsl.js';

/**
 * A node inside a CPEE process tree annotated with change related information.
 * This class serves as the basis for enhanced and interactive diff
 * visualization.
 */
export class DeltaNode extends Node {
  /** @type {!String} */
  type;
  /** @type {!Map<String, Update>} */
  updates;
  /** @type {!Array<DeltaNode>} */
  placeholders;
  /** @type {?Number} */
  baseNode;

  /**
   * @param {!String} label
   * @param {?String} text
   * @param {!String} type
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
   * @return {!Boolean} If this node was updated.
   */
  isUpdated() {
    return this.updates.size > 0;
  }

  /**
   * @return {!Boolean} If this node was moved.
   */
  isMoved() {
    return this.type === Dsl.CHANGE_MODEL.MOVE_TO.label;
  }

  /**
   * @return {!Boolean} If this node was deleted.
   */
  isDeleted() {
    return this.type === Dsl.CHANGE_MODEL.DELETION.label;
  }

  /**
   * @return {!Boolean} If this node was inserted.
   */
  isInserted() {
    return this.type === Dsl.CHANGE_MODEL.INSERTION.label;
  }

  /**
   * @return {!Boolean} If this node was not changed.
   */
  isNil() {
    return this.type === Dsl.CHANGE_MODEL.NIL.label && !this.isUpdated();
  }

  /**
   * Create a new DeltaNode instance from an existing node.
   * @param {!Node} node
   * @param {!Boolean} includeChildren
   * @return {!Node}
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
}

