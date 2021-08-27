/**
 * Extractor for retrieving and caching the unique ID of a node.
 * @implements {ExtractorInterface<Number>}
 */
export class IdExtractor {
  /**
   * @inheritDoc
   * @type {Map<Node,Number>}
   * @protected
   */
  _memo;

  /**
   * Extract the ID for a node and cache it.
   * @param {Node} node
   * @protected
   */
  _extract(node) {
    // Compute all ids on first use
    let root;
    if (node.parent == null) {
      root = node;
    } else {
      root = node.path()[0].parent;
    }
    const preOrder = root.toPreOrderArray();
    for (let i = 0; i < preOrder.length; i++) {
      this._memo.set(preOrder[i], i);
    }
  }

  /**
   * Get the cached ID (index within pre-order
   * traversal) for a node. If it is not cached, compute it first.
   * @param {Node} node
   * @return {Number}
   */
  get(node) {
    if (!this._memo.has(node)) {
      this._extract(node);
    }
    return this._memo.get(node);
  }

  /**
   * Create a new Extractor instance
   */
  constructor() {
    this._memo = new Map();
  }
}
