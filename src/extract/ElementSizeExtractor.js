/**
 * Extractor for retrieving and caching the size of a subtree in terms of
 * non-Property nodes only.
 * @implements {ExtractorInterface<Number>}
 */
export class ElementSizeExtractor {
  /**
   * @inheritDoc
   * @type {Map<Node,Number>}
   * @protected
   */
  _memo;

  /**
   * Extract the element size for a subtree and cache it.
   * @param {Node} node The root of the subtree
   * @protected
   */
  _extract(node) {
    let size = 0;
    if (!node.isPropertyNode()) {
      size = 1;
      for (const child of node) {
        // Use cached values to improve runtime
        size += this.get(child);
      }
    }
    this._memo.set(node, size);
  }

  /**
   * Get the cached element size of a subtree. If it is not cached,
   * compute it first.
   * @param {Node} node The root node of the subtree
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
