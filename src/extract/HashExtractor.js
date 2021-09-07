import {ExtractorInterface} from './ExtractorInterface.js';
import {getPrimes} from '../diff/lib/PrimeGenerator.js';
import {stringHash} from '../diff/lib/StringHash.js';

/**
 * Extractor for retrieving and caching the hash (and content hash) value
 * for a subtree.
 * @implements{ExtractorInterface<Number>}
 */
export class HashExtractor extends ExtractorInterface {
  /**
   * @inheritDoc
   * @type {Map<Node,Number>}
   * @protected
   */
  _memo;

  /**
   * Extract the hash value for a subtree and cache it.
   * @param {Node} node The root of the subtree.
   * @protected
   */
  _extract(node) {
    this._memo.set(node, this.getContentHash(node) + this.#childHash(node));
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
   * @type {Map<Node,Number>}
   * @private
   */
  #contentHashMemo;

  /**
   * Create a new instance.
   */
  constructor() {
    super();
    this._memo = new Map();
    this.#contentHashMemo = new Map();
  }

  /**
   * Compute the child hash value for a subtree.
   * @param {Node} node The root of the subtree
   * @return {Number}
   * @private
   */
  #childHash(node) {
    let childHash;
    if (node.hasInternalOrdering()) {
      // Respect order by multiplying child hashes with distinct prime number
      // based on index
      const primes = getPrimes(node.degree());
      childHash = node
          .children
          // Use child hash value
          .map((child, i) => this.get(child) * primes[i])
          .reduce((prev, curr) => prev + curr, 0);
    } else {
      // Arbitrary order, achieved by simple addition
      childHash = node
          .children
          // Use child hash value
          .map((child) => this.get(child))
          .reduce((prev, curr) => prev + curr, 0);
    }
    return childHash;
  }

  /**
   * Compute the content hash value for a subtree.
   * @param {Node} node The root of the subtree
   * @return {Number}
   * @private
   */
  #contentHash(node) {
    let content = node.label;
    // Attribute order is irrelevant
    const sortedAttrList =
        [...node.attributes.keys()]
            .filter((key) => key !== 'xmlns') // Ignore namespaces
            .sort();
    for (const key of sortedAttrList) {
      content += key + '=' + node.attributes.get(key);
    }
    if (node.text != null) {
      content += node.text;
    }
    return stringHash(content);
  }

  /**
   * Get the cached content hash value for a subtree.
   * If it is not cached, calculate and cache it first.
   * @param {Node} node The root of the subtree.
   * @return {Number}
   */
  getContentHash(node) {
    if (!this.#contentHashMemo.has(node)) {
      this.#contentHashMemo.set(node, this.#contentHash(node));
    }
    return this.#contentHashMemo.get(node);
  }
}
