import {EditOperation} from './EditOperation.js';
import {Dsl} from '../Dsl.js';
import {HashExtractor} from '../extract/HashExtractor.js';
import {Patcher} from '../patch/Patcher.js';
import {Node} from '../tree/Node.js';
import {DomHelper} from '../../util/DomHelper.js';
import xmldom from 'xmldom';

/**
 * A wrapper class for an ordered sequence of edit operations, commonly
 * referred to as an edit script. An edit script captures the changes that
 * transform one version of a process tree into another.
 */
export class EditScript {
  /**
   * @type {Array<EditOperation>}
   * @private
   */
  #editOperations;

  /**
   * Construct a new EditScript instance.
   */
  constructor() {
    this.#editOperations = [];
    this.#cost = 0;
  }

  /**
   * @type {Number}
   * @private
   */
  #cost;

  /** @return {Number} */
  get cost() {
    return this.#cost;
  }

  /**
   * Regenerate an EditSript instance from an XML document or xmldom Object.
   * @param {String|Object} xmlElement The XML document as a string or xmldom
   *     Object.
   * @return {EditScript}
   */
  static fromXml(xmlElement) {
    if (xmlElement.constructor === String) {
      xmlElement = DomHelper.firstChildElement(
          new xmldom
              .DOMParser()
              .parseFromString(xmlElement, 'text/xml'));
    }
    const editScript = new EditScript();
    if (xmlElement.hasAttribute('cost')) {
      editScript.#cost = parseInt(xmlElement.getAttribute('cost'));
    }
    DomHelper.forAllChildElements(xmlElement, (xmlChange) =>
      editScript.#editOperations.push(EditOperation.fromXml(xmlChange)));
    return editScript;
  }

  /**
   * @return {IterableIterator<EditOperation>} An iterator for the changes
   *     contained in this edit script.
   */
  [Symbol.iterator]() {
    return this.#editOperations[Symbol.iterator]();
  }

  /**
   * Append a DELETE operation to this edit script.
   * @param {Node} deletedNode The root of the deleted subtree.
   */
  delete(deletedNode) {
    this.#editOperations.push(
        new EditOperation(
            Dsl.CHANGE_MODEL.DELETION.label,
            deletedNode.xPath(),
            null,
            null,
        ));
    this.#cost += deletedNode.size();
  }

  /**
   * Count the number of deletions in this edit script.
   * @return {Number}
   */
  deletions() {
    return this
        .#editOperations
        .filter((editOp) => editOp.type === Dsl.CHANGE_MODEL.DELETION.label)
        .length;
  }

  /**
   * Append a INSERT operation to this edit script.
   * @param {Node} insertedNode The root of the inserted subtree *after* it has
   *     been inserted.
   */
  insert(insertedNode) {
    this.#editOperations.push(
        new EditOperation(
            Dsl.CHANGE_MODEL.INSERTION.label,
            null,
            insertedNode.xPath(),
            Node.fromNode(insertedNode),
        ));
    this.#cost += insertedNode.size();
  }

  /**
   * Count the number of insertions in this edit script.
   * @return {Number}
   */
  insertions() {
    return this
        .#editOperations
        .filter((editOp) => editOp.type === Dsl.CHANGE_MODEL.INSERTION.label)
        .length;
  }

  /**
   * Check if this edit script is valid for a process tree transformation.
   * @param {Node} oldTree The root of the old (original) process tree.
   * @param {Node} newTree The root of the new (changed) process tree.
   * @return {Boolean} True, iff this edit script is valid.
   */
  isValid(oldTree, newTree) {
    const patchedTree = new Patcher().patch(oldTree, this);
    const hashExtractor = new HashExtractor();
    return hashExtractor.get(patchedTree) === hashExtractor.get(newTree);
  }

  /**
   * Append a MOVE operation to this edit script.
   * @param {String} oldPath The path of the moved node *before* it was moved.
   * @param {String} newPath The path of the moved node *after* it was moved.
   */
  move(oldPath, newPath) {
    this.#editOperations.push(
        new EditOperation(
            Dsl.CHANGE_MODEL.MOVE_TO.label,
            oldPath,
            newPath,
            null,
        ));
    this.#cost++;
  }

  /**
   * Count the number of moves in this edit script.
   * @return {Number}
   */
  moves() {
    return this
        .#editOperations
        .filter((editOp) => editOp.type === Dsl.CHANGE_MODEL.MOVE_TO.label)
        .length;
  }

  /** @return {Number} */
  size() {
    return this.#editOperations.length;
  }

  /**
   * Append an UPDATE operation to this edit script.
   * @param {Node} updatedNode The updated node *after* the update was applied.
   */
  update(updatedNode) {
    this.#editOperations.push(new EditOperation(
        Dsl.CHANGE_MODEL.UPDATE.label,
        updatedNode.xPath(),
        null,
        Node.fromNode(updatedNode, false),
    ));
    this.#cost++;
  }

  /**
   * Count the number of updates in this edit script.
   * @return {Number}
   */
  updates() {
    return this
        .#editOperations
        .filter((editOp) => editOp.type === Dsl.CHANGE_MODEL.UPDATE.label)
        .length;
  }
}
