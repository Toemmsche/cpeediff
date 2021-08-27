/**
 * Extractor for retrieving and caching the size of a subtree.
 * @implements {ExtractorInterface<Number>}
 */
export class SizeExtractor {
  /**
   * @inheritDoc
   * @type {Map<Node,Number>}
   * @protected
   */
  _memo;

  /**
   * Create a new SizeExtractor instance
   */
  constructor() {
    this._memo = new Map();
  }

  /**
   * Get the cached size of a subtree.
   * If it is not cached, calculate and cache it first.
   * @param {Node} node The root of the subtree
   * @return {Number}
   */
  get(node) {
    if (!this._memo.has(node)) {
      this._extract(node);
    }
    return this._memo.get(node);
  }

  /**
   * Extract the size for a subtree and cache it.
   * @param {Node} node The root node of the subtree.
   * @protected
   */
  _extract(node) {
    let size = 1;
    for (const child of node) {
      size += this.get(child);
    }
    this._memo.set(node, size);
  }
}
