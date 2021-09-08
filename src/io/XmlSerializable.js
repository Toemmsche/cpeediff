import {Logger} from '../util/Logger.js';
import xmldom from '@xmldom/xmldom';
import {Dsl} from '../config/Dsl.js';

/**
 * Interface for all classes whose objects can be serialized to and
 * deserialized from XML documents and XML DOM objects.
 * @interface
 * @template T
 */
export class XmlSerializable {
  /**
   * @param {String} xmlElement The XML DOM object.
   * @return {T}
   * @abstract
   */
  static fromXmlDom(xmlElement) {
    Logger.abstractMethodExecution();
    return null;
  }

  /**
   * @abstract
   * @param {String} xml The XML document.
   * @return {T}
   */
  static fromXmlString(xml) {
    Logger.abstractMethodExecution();
    return null;
  }

  /**
   * @param {Object} ownerDocument The owner document of the generated XML
   *     element.
   * @return {Object} XML DOM object for this object.
   * @abstract
   */
  toXmlDom(ownerDocument = xmldom
      .DOMImplementation
      .prototype
      .createDocument(Dsl.DEFAULT_NAMESPACE)) {
    Logger.abstractMethodExecution();
    return null;
  }

  /**
   * @return {String} XML document for this object. Must honor PRETTY_XML
   *     config.
   * @abstract
   */
  toXmlString() {
    Logger.abstractMethodExecution();
    return '';
  }
}
