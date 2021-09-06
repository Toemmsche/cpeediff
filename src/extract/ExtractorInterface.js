import {Logger} from '../util/Logger.js';

/**
 * Abstract superclass for all extractors.
 * Extractors compute values relevant for the diff algorithm and cache them
 * to save future computation costs.
 * @interface
 * @template T
 */
export class ExtractorInterface {
  /**
   * The cached values.
   * @type {Map<Node,T>}
   * @protected
   * @abstract
   */
  _memo;

  /**
   * Create a new Extractor instance
   */
  constructor() {
    this._memo = new Map();
  }

  /**
   * Perform the extraction for the value type cached by this extractor.
   * @param {Node} node The node for which to compute the value.
   * @protected
   * @abstract
   */
  _extract(node) {
    Logger.abstractMethodExecution();
  }

  /**
   * Get the desired value. If it is not cached, calculate and cache it first.
   * @param {Node} node The node to which the value corresponds to.
   * @return {T} The desired value.
   * @abstract
   */
  get(node) {
    Logger.abstractMethodExecution();
  }
}
