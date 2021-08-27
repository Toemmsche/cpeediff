import {Logger} from '../../util/Logger.js';

/**
 * Wrapper class for a bidirectional mapping between the nodes of two process
 * trees.
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
      const msg = 'Matching of already matched node';
      Logger.error(msg, this);
    }
    if (newNode == null || oldNode == null) {
      const msg = 'Matching of undefined or null';
      Logger.error(msg, this);
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
}

