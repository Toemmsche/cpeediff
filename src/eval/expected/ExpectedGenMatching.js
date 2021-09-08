import {AbstractExpected} from './AbstractExpected.js';

/**
 * The expected matching for a match test case containing generated process
 * trees.
 */
export class ExpectedGenMatching extends AbstractExpected {
  /**
   * The expected matching.
   * @type {Matching}
   * @const
   */
  matching;

  /**
   * Create a new ExpectedGenMatching instance.
   * @param {Matching} matching The expected matching.
   */
  constructor(matching) {
    super();
    this.matching = matching;
  }
}


