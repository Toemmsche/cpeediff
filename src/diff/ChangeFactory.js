import {EditOperation} from './EditOperation.js';
import xmldom from 'xmldom';
import {DomHelper} from '../../util/DomHelper.js';

export class ChangeFactory {
  static getChange(source) {
    switch (source.constructor) {
      case String:
        return this._fromXmlString(source);
      default:
        return this._fromXmlDom(source);
    }
  }

  static _fromXmlDom(xmlElement) {
    // Drop root slash
    const [type, oldPath, newPath] = [xmlElement.localName, xmlElement.getAttribute('oldPath').slice(1), xmlElement.getAttribute('newPath').slice(1)];
    let newContent;
    const xmlContent = DomHelper.firstChildElement(xmlElement);
    if (xmlContent != null) {
      newContent = Node.fromNode(xmlContent);
    }
    return new EditOperation(type, oldPath, newPath, newContent);
  }

  static _fromXmlString(xml) {
    return this._fromXmlDom(new xmldom.DOMParser().parseFromString(xml, 'text/xml'));
  }
}
