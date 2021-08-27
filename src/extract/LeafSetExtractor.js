/**
 * Extractor for retrieving and caching the set of leaves of a subtree.
 * @implements {ExtractorInterface<Set<Node>>}
 */

export class LeafSetExtractor {
  /**
   * @inheritDoc
   * @type {Map<Node,Set<Node>>}
   * @protected
   */
  _memo;

  /**
   * Extract the set of leaves for a subtree and cache it.
   * @param {Node} node The root of the subtree.
   * @protected
   */
  _extract(node) {
    this._memo.set(node, new Set(node.leaves()));
  }

  /**
   * Get the cached set of leaves for a subtree.
   * If it is not cached, compute it first.
   * @param {Node} node The root of the subtree.
   * @return {Set<Node>}
   */
  get(node) {
    if (!this._memo.has(node)) {
      this._extract(node);
    }
    return this._memo.get(node);
  }

  /**
   * Create a new LeafSetExtractor instance
   */
  constructor() {
    this._memo = new Map();
  }
}
