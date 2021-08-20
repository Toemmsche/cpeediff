import {DomHelper} from '../../util/DomHelper.js';
import {Node} from '../tree/Node.js';
import xmldom from 'xmldom';

/**
 * Data class for a single edit operation. Every edit operation in the CpeeDiff
 * change model is quadruple, although not all values must be present to
 * successfully apply an edit operation.
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
   * Regenerate an EditOperation instance from an XML document or xmldom Object.
   * @param {String|Object} xmlElement The XML document as a string or xmldom
   *     Object.
   * @return {EditOperation}
   */
  static fromXml(xmlElement) {
    if (xmlElement.constructor === String) {
      xmlElement = DomHelper.firstChildElement(
          new xmldom
              .DOMParser()
              .parseFromString(xmlElement, 'text/xml'));
    }

    const [
      type,
      oldPath,
      newPath,
    ] =
        [
          xmlElement.localName,
          xmlElement.getAttribute('oldPath').slice(1), // Drop root slash
          xmlElement.getAttribute('newPath').slice(1), // Drop root slash
        ];
    let newContent;
    const xmlContent = DomHelper.firstChildElement(xmlElement);
    if (xmlContent != null) {
      newContent = Node.fromXml(xmlContent);
    }
    return new EditOperation(type, oldPath, newPath, newContent);
  }

  /**
   * Create a string representation of this edit operation.
   * @return {String}
   */
  toString() {
    return this.type + ' ' +
        (this.oldPath !== null ? this.oldPath + ' ' : '') +
        (this.oldPath !== null && this.newPath !== null ? '-> ' : '') +
        (this.newPath !== null ? this.newPath + ' ' : '') +
        (this.newContent !== null ? this.newContent + ' ' : '');
  }
}
