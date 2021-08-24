import {DomHelper} from '../../util/DomHelper.js';
import {Node} from '../tree/Node.js';
import xmldom from 'xmldom';
import {Dsl} from '../Dsl.js';

/**
 * Data class for a single edit operation. Every edit operation in the CpeeDiff
 * change model is quadruple, although not all values must be present to
 * successfully apply an edit operation.
 *
 * @implements {XmlSerializable<EditOperation>}
 */
export class EditOperation {
  /**
   * The type of edit operation.
   * @type {String}
   * @const
   */
  type;
  /**
   * The path of the node affected by this edit operation *before* it was
   * applied.
   * @type {?String}
   * @const
   */
  oldPath;
  /**
   * The path of the node affected by this edit operation *after* it was
   * applied.
   * @type {?String}
   * @const
   */
  newPath;
  /**
   * The new content added by this edit operation.
   * @type {?Node}
   * @const
   */
  newContent;

  /**
   * Construct a new EditOperation instance.
   * @param {String} type The type of edit operation.
   * @param {?String} oldPath The path of the node affected by this edit
   *     operation *before* it was applied.
   * @param {?String} newPath The path of the node affected by this edit
   *     operation *after* it was applied.
   * @param {?Node} newContent The new content added by this edit operation.
   */
  constructor(
      type,
      oldPath = null,
      newPath = null,
      newContent = null,
  ) {
    this.type = type;
    this.oldPath = oldPath;
    this.newPath = newPath;
    this.newContent = newContent;
  }

  /**
   * @param {Object} xmlElement The XML DOM object.
   * @return {EditOperation}
   */
  static fromXmlDom(xmlElement) {
    let newContent;
    const xmlContent = DomHelper.firstChildElement(xmlElement);
    if (xmlContent != null) {
      newContent = Node.fromXmlDom(xmlContent);
    }
    return new EditOperation(
        xmlElement.localName,
        xmlElement.getAttribute('oldPath').slice(1), // Drop root slash
        xmlElement.getAttribute('newPath').slice(1),
        newContent,
    );
  }

  /**
   * @param {String} xml The XML document.
   * @return {EditOperation}
   */
  static fromXmlString(xml) {
    return this.fromXmlDom(DomHelper.firstChildElement(
        new xmldom
            .DOMParser()
            .parseFromString(xml, 'text/xml')));
  }

  /** @return {Boolean} */
  isDeletion() {
    return this.type === Dsl.CHANGE_MODEL.DELETION.label;
  }

  /** @return {Boolean} */
  isInsertion() {
    return this.type === Dsl.CHANGE_MODEL.INSERTION.label;
  }

  /** @return {Boolean} */
  isMove() {
    return this.type === Dsl.CHANGE_MODEL.MOVE.label;
  }

  /** @return {Boolean} */
  isUpdate() {
    return this.type === Dsl.CHANGE_MODEL.UPDATE.label;
  }

  /**
   * @return {String} A string representation of this edit operation.
   */
  toString() {
    return this.type + ' ' +
        (this.oldPath !== null ? this.oldPath + ' ' : '') +
        (this.oldPath !== null && this.newPath !== null ? '-> ' : '') +
        (this.newPath !== null ? this.newPath + ' ' : '') +
        (this.newContent !== null ? this.newContent + ' ' : '');
  }

  /**
   * @return {Object} The XML DOM object for this edit operation.
   */
  toXmlDom() {
    const doc =
        xmldom
            .DOMImplementation
            .prototype
            .createDocument(Dsl.DEFAULT_NAMESPACE);

    const xmlNode = doc.createElement(this.type);
    if (this.oldPath != null) {
      // Add root slash
      xmlNode.setAttribute('oldPath', '/' + this.oldPath);
    }
    if (this.newPath != null) {
      // Add root slash
      xmlNode.setAttribute('newPath', '/' + this.newPath);
    }
    if (this.newContent != null) {
      xmlNode.appendChild(this.newContent.toXmlDom(true));
    }

    return xmlNode;
  }

  /**
   * @return {String} The XML document for this edit operation.
   */
  toXmlString() {
    return new xmldom.XMLSerializer().serializeToString(this.toXmlDom());
  }
}
