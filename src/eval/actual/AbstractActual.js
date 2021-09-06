/**
 * Abstract superclass for actual output produced by an algorithm.
 * @abstract
 */
export class AbstractActual {
  /**
   * The raw output of the algorithm.
   * @type {String}
   * @const
   */
  raw;

  /**
   * @param {String} raw The raw output of the algorithm.
   */
  constructor(raw) {
    this.raw = raw;
  }
}


