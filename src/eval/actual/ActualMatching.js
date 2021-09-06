import {AbstractActual} from './AbstractActual.js';

/**
 * Data class for the actual output of a matching algorithm.
 */
export class ActualMatching extends AbstractActual {
  /**
   * The internal representation of the raw matching output.
   * @type {Matching}
   * @const
   */
  matching;

  /**
   * Construct a new ActualMatching instance.
   * @param {String} raw The raw matching output.
   * @param {Matching} matching The corresponding matching instance containing
   *     the same matches.
   */
  constructor(raw, matching) {
    super(raw);
    this.matching = matching;
  }
}


