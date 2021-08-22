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
  /** @type {String} */
  type;
  /** @type {?String} */
  oldPath;
  /** @type {?String} */
  newPath;
  /** @type {?Node} */
  newContent;

  /**
   * Construct a new EditOperation instance.
   * @param {String} type
   * @param {?String} oldPath
   * @param {?String} newPath
   * @param {?Node} newContent
   */
  constructor(type, oldPath = null, newPath = null, newContent = null) {
    this.type = type;
    this.oldPath = oldPath;
    this.newPath = newPath;
    this.newContent = newContent;
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
