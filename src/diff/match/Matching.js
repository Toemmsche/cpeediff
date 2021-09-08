import {Logger} from '../../util/Logger.js';
import xmldom from '@xmldom/xmldom';
import {DiffConfig} from '../../config/DiffConfig.js';
import vkbeautify from 'vkbeautify';
import {Dsl} from '../../config/Dsl.js';
import {IdExtractor} from '../../extract/IdExtractor.js';

/**
 * Wrapper class for a bidirectional mapping between the nodes of two process
 * trees.
 *
 * @implements {XmlSerializable<Matching>}
 */
export class Matching {
  /**
   * The mapping from new to old nodes.
   * @type Map<Node,Node>
   * @const
   */
  newToOldMap;
  /**
   * The mapping from old to new nodes.
   * @type Map<Node,Node>
   * @const
   */
  oldToNewMap;

  /**
   * Construct a new Matching instance.
   */
  constructor() {
    this.newToOldMap = new Map();
    this.oldToNewMap = new Map();
  }

  /**
   * @param {Node} oldNode
   * @param {Node} newNode
   * @return {Boolean} True, iff they are matched.
   */
  areMatched(oldNode, newNode) {
    return this.isMatched(newNode) && this.getMatch(newNode) === oldNode;
  }

  /**
   * Get the matching partner of a new or old node, if it exists.
   * @param {Node} node
   * @return {?Node}
   */
  getMatch(node) {
    return this.newToOldMap.get(node) ?? this.oldToNewMap.get(node);
  }

  /**
   * @param {Node} node
   * @return {Boolean} True, iff the node is matched.
   */
  isMatched(node) {
    return this.newToOldMap.has(node) || this.oldToNewMap.has(node);
  }

  /**
   * Match a new node to an old node.
   * @param {Node} newNode
   * @param {Node} oldNode
   */
  matchNew(newNode, oldNode) {
    if (this.isMatched(newNode) || this.isMatched(oldNode)) {
      Logger.error('Matching of already matched node', this);
    }
    if (newNode == null || oldNode == null) {
      Logger.error('Matching of undefined or null', this);
    }
    this.newToOldMap.set(newNode, oldNode);
    this.oldToNewMap.set(oldNode, newNode);
  }

  /**
   * @return {Number} The number of matched nodes.
   */
  size() {
    return this.newToOldMap.size;
  }

  /**
   * @param {Object} ownerDocument The owner document of the generated XML
   *     element.
   * @return {Object} The XML DOM object for this matching.
   */
  toXmlDom(ownerDocument = xmldom
      .DOMImplementation
      .prototype
      .createDocument(Dsl.DEFAULT_NAMESPACE)) {
    const xmlRoot = ownerDocument.createElement('matching');
    xmlRoot.setAttribute('size', this.size());
    const idExtractor = new IdExtractor();
    for (const [oldNode, newNode] of this.oldToNewMap) {
      const xmlMatch = ownerDocument.createElement('match');
      xmlMatch.setAttribute('old_id', idExtractor.get(oldNode));
      xmlMatch.setAttribute('new_id', idExtractor.get(newNode));
      xmlRoot.appendChild(xmlMatch);
    }
    return xmlRoot;
  }

  /**
   * @return {String} The XML document for this matching.
   */
  toXmlString() {
    const str = new xmldom.XMLSerializer().serializeToString(this.toXmlDom());
    if (DiffConfig.PRETTY_XML) {
      return vkbeautify.xml(str);
    } else {
      return str;
    }
  }
}

