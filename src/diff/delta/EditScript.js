import {EditOperation} from './EditOperation.js';
import {Dsl} from '../../config/Dsl.js';
import {HashExtractor} from '../../extract/HashExtractor.js';
import {Patcher} from '../patch/Patcher.js';
import {Node} from '../../tree/Node.js';
import {DomHelper} from '../../util/DomHelper.js';
import xmldom from '@xmldom/xmldom';
import vkbeautify from 'vkbeautify';
import {DiffConfig} from '../../config/DiffConfig.js';

/**
 * A wrapper class for an ordered sequence of edit operations, commonly
 * referred to as an edit script. An edit script captures the changes that
 * transform one version of a process tree into another.
 *
 * @implements {XmlSerializable<EditScript>}
 */
export class EditScript {
  /**
   * The edit operations contained in this edit script.
   * @type {Array<EditOperation>}
   * @private
   * @const
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
   * @return {Array<EditOperation>}
   */
  get editOperations() {
    return this.#editOperations;
  }

  /**
   * The total cost of this edit script.
   * @type {Number}
   * @private
   */
  #cost;

  /** @return {Number} */
  get cost() {
    return this.#cost;
  }

  /**
   * @param {Object} xmlElement The XML DOM object.
   * @return {EditScript}
   */
  static fromXmlDom(xmlElement) {
    const editScript = new EditScript();
    if (xmlElement.hasAttribute('cost')) {
      editScript.#cost = parseInt(xmlElement.getAttribute('cost'));
    }
    DomHelper.forAllChildElements(xmlElement, (xmlChange) =>
        editScript.#editOperations.push(EditOperation.fromXmlDom(xmlChange)));
    return editScript;
  }

  /**
   * @param {String} xml The XML document.
   * @return {EditScript}
   */
  static fromXmlString(xml) {
    return this.fromXmlDom(DomHelper.firstChildElement(
        new xmldom
            .DOMParser()
            .parseFromString(xml, 'text/xml')));
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
  appendDeletion(deletedNode) {
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
   * Append a INSERT operation to this edit script.
   * @param {Node} insertedNode The root of the inserted subtree *after* it has
   *     been inserted.
   */
  appendInsertion(insertedNode) {
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
   * Append a MOVE operation to this edit script.
   * @param {String} oldPath The path of the moved node *before* it was moved.
   * @param {String} newPath The path of the moved node *after* it was moved.
   */
  appendMove(oldPath, newPath) {
    this.#editOperations.push(
        new EditOperation(
            Dsl.CHANGE_MODEL.MOVE.label,
            oldPath,
            newPath,
            null,
        ));
    this.#cost++;
  }

  /**
   * Append an UPDATE operation to this edit script.
   * @param {Node} updatedNode The updated node *after* the update was applied.
   */
  appendUpdate(updatedNode) {
    this.#editOperations.push(
        new EditOperation(
            Dsl.CHANGE_MODEL.UPDATE.label,
            updatedNode.xPath(),
            null,
            Node.fromNode(updatedNode, false),
        ));
    this.#cost++;
  }

  /**
   * @return {Number} The number of deletions in this edit script.
   */
  deletions() {
    return this
        .#editOperations
        .filter((editOp) => editOp.type === Dsl.CHANGE_MODEL.DELETION.label)
        .length;
  }

  /**
   * @return {Number} The number of insertions in this edit script.
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
   * @return {Number} The number of moves in this edit script.
   */
  moves() {
    return this
        .#editOperations
        .filter((editOp) => editOp.type === Dsl.CHANGE_MODEL.MOVE.label)
        .length;
  }

  /** @return {Number} */
  size() {
    return this.#editOperations.length;
  }

  /**
   * @param {Object} ownerDocument The owner document of the generated XML
   *     element.
   * @return {Object} The XML DOM object for this edit script.
   */
  toXmlDom(ownerDocument = xmldom
      .DOMImplementation
      .prototype
      .createDocument(Dsl.DEFAULT_NAMESPACE)) {
    const xmlNode = ownerDocument.createElement('delta');
    xmlNode.setAttribute('cost', this.#cost);
    for (const change of this) {
      xmlNode.appendChild(change.toXmlDom(ownerDocument));
    }

    return xmlNode;
  }

  /**
   * @return {String} The XML document for this edit script.
   */
  toXmlString() {
    const str = new xmldom.XMLSerializer().serializeToString(this.toXmlDom());
    if (DiffConfig.PRETTY_XML) {
      return vkbeautify.xml(str);
    } else {
      return str;
    }
  }

  /**
   * @return {Number} The number of updates in this edit script.
   */
  updates() {
    return this
        .#editOperations
        .filter((editOp) => editOp.type === Dsl.CHANGE_MODEL.UPDATE.label)
        .length;
  }
}
