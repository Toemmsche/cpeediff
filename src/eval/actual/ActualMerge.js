import {AbstractActual} from './AbstractActual.js';

/**
 * Data class for the actual output of a merge algorithm.
 */
export class ActualMerge extends AbstractActual {
  /**
   * The root of the internal tree representation of the merge result.
   * @type {Node}
   * @const
   */
  tree;

  /**
   * Construct a new ActualMerge instance.
   * @param {String} raw The raw XML document containing the merge result.
   * @param {Node} tree The root of the internal tree representation of the
   *     merge result.
   */
  constructor(raw, tree) {
    super(raw);
    this.tree = tree;
  }
}


