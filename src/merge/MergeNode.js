import {DeltaNode} from '../diff/patch/DeltaNode.js';
import {Confidence} from './Confidence.js';
import {Dsl} from '../config/Dsl.js';
import xmldom from '@xmldom/xmldom';

/**
 * A node inside a merged process tree.
 *
 * @implements {XmlSerializable<MergeNode>}
 * @extends {DeltaNode}
 */
export class MergeNode extends DeltaNode {
  /**
   * The branch in which this node was changed (none: 0, branch 1: 1,
   * branch 2: 2, or both: 3).
   * @type {Number}
   */
  changeOrigin;
  /**
   * An object containing the confidence of the merge regarding
   * the node's content, parent node, and position (within its parent's child
   * list).
   * @type {Confidence}
   */
  confidence;

  /**
   * Construct a new MergeNode instance.
   * @param {String} label The node label.
   * @param {?String} text The text content.
   * @param {String} type The type of change this node was affected by.
   * @param {?Number} baseNode The base node ID.
   * @param {Number} changeOrigin The branch in which this node was changed (0
   *     if unchanged).
   */
  constructor(
      label,
      text = null,
      type = 'NIL',
      baseNode = null,
      changeOrigin = 0,
  ) {
    super(label, text, type, baseNode);
    this.changeOrigin = changeOrigin;
    // Initial confidence is high
    this.confidence = new Confidence(true, true, true);
  }

  /**
   * Create a new MergeNode instance from an existing node.
   * @param {Node} node The existing node.
   * @param {Boolean} includeChildren Whether to copy the children of the node.
   * @return {MergeNode}
   * @override
   */
  static fromNode(node, includeChildren = true) {
    const mergeNode = new MergeNode(node.label, node.text);
    for (const [key, value] of node.attributes) {
      mergeNode.attributes.set(key, value);
    }
    if (includeChildren) {
      for (const child of node) {
        mergeNode.appendChild(this.fromNode(child, includeChildren));
      }
    }
    if (node instanceof DeltaNode) {
      mergeNode.type = node.type;
      mergeNode.baseNode = node.baseNode;
      for (const placeholder of node.placeholders) {
        mergeNode.placeholders.push(this.fromNode(placeholder, true));
      }
      for (const [key, update] of node.updates) {
        mergeNode.updates.set(key, update.copy());
      }
    }
    if (node instanceof MergeNode) {
      mergeNode.confidence = Object.assign(new Confidence(), node.confidence);
      mergeNode.changeOrigin = node.changeOrigin;
    }
    return mergeNode;
  }

  /**
   * @return {Object} XML DOM object for this merge node and its children.
   * @override
   */
  toXmlDom(ownerDocument = xmldom
      .DOMImplementation
      .prototype
      .createDocument(Dsl.DEFAULT_NAMESPACE)) {
    const deltaXmlRoot = DeltaNode.fromNode(this, true).toXmlDom(ownerDocument);

    deltaXmlRoot.setAttribute('xmlns:' + Dsl.MERGE_TREE.NAMESPACE_PREFIX,
        Dsl.MERGE_TREE.NAMESPACE_URI);

    const annotate = (mergeNode, xmlElement) => {
      if (!mergeNode.isUnchanged()) {
        for (const [key, update] of mergeNode.updates) {
          xmlElement.setAttribute(
              Dsl.MERGE_TREE.NAMESPACE_PREFIX + ':' + key,
              update.origin,
          );
        }
        if (mergeNode.isDeleted() ||
            mergeNode.isMoved() ||
            mergeNode.isInserted()) {
          xmlElement.setAttribute(
              Dsl.MERGE_TREE.NAMESPACE_PREFIX + ':this',
              mergeNode.changeOrigin,
          );
        }
        if (!mergeNode.confidence.contentConfident) {
          xmlElement.setAttribute(
              Dsl.MERGE_TREE.NAMESPACE_PREFIX + ':content_confident',
              'false',
          );
        }
        if (!mergeNode.confidence.parentConfident) {
          xmlElement.setAttribute(
              Dsl.MERGE_TREE.NAMESPACE_PREFIX + ':parent_confident',
              'false',
          );
        }
        if (!mergeNode.confidence.positionConfident) {
          xmlElement.setAttribute(
              Dsl.MERGE_TREE.NAMESPACE_PREFIX + ':position_confident',
              'false',
          );
        }
      }
      for (let i = 0; i < mergeNode.degree(); i++) {
        annotate(mergeNode.getChild(i), xmlElement.childNodes.item(i));
      }
    };

    annotate(this, deltaXmlRoot);
    return deltaXmlRoot;
  }
}
