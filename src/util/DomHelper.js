/**
 * Helper class to navigate XML DOM objects.
 */
export class DomHelper {

  /**
   * Enum for possible XML DOM node types.
   * @type {Object}
   */
  static XML_NODE_TYPES = {
    ELEMENT: 1,
    TEXT: 3,
  };

  /**
   * Get the first child of an XML element that is also an element.
   * Can also filter for a specific tag name.
   * @param {Object} xmlParent The parent XML element.
   * @param {?String} localName The required name of the child element. If
   *     null, no tag name restrictions apply.
   * @return {Object} The first child node that is an XML element.
   */
  static firstChildElement(xmlParent, localName = null) {
    let xmlChild = xmlParent?.firstChild;
    while (xmlChild != null &&
    (xmlChild.nodeType !== this.XML_NODE_TYPES.ELEMENT ||
        (localName != null && xmlChild.localName !== localName))) {
      xmlChild = xmlChild.nextSibling;
    }
    return xmlChild;
  }

  /**
   * Execute a function for all element children of an XML element.
   * @param {Object} xmlParent The parent XML element.
   * @param {Function} func The function to execute.
   */
  static forAllChildElements(xmlParent, func) {
    if (xmlParent == null) return;
    for (let i = 0; i < xmlParent.childNodes.length; i++) {
      const xmlChild = xmlParent.childNodes.item(i);
      if (xmlChild.nodeType === 1) {
        func(xmlChild);
      }
    }
  }
}

