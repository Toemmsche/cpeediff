import {AbstractExpected} from './AbstractExpected.js';

/**
 * A set of rules that define the expected result of a match test case.
 * All nodes are addressed by their ID, i.e. their position in the pre-order
 * traversal of a process tree.
 */
export class ExpectedMatching extends AbstractExpected {
  /**
   * A list of required matches.
   * @type {Array<[Number, Number]>}
   * @const
   */
  matches;
  /**
   * A list of forbidden matches.
   * @type {Array<[Number, Number]>}
   * @const
   */
  notMatches;
  /**
   * A list of old nodes that should be matched.
   * @type {Array<Number>}
   * @const
   */
  oldMatched;
  /**
   * A list of old nodes that should not be matched.
   * @type {Array<Number>}
   * @const
   */
  notOldMatched;
  /**
   * A list of new nodes that should be matched.
   * @type {Array<Number>}
   * @const
   */
  newMatched;
  /**
   * A list of new nodes that should not be matched.
   * @type {Array<Number>}
   * @const
   */
  notNewMatched;

  /**
   * Create an empty ExpectedMatch instance.
   * The properties are are set through Object.assign() using an
   * expected.json file found in a match test case directory.
   */
  constructor() {
    super();
    this.matches = [];
    this.notMatches = [];
    this.oldMatched = [];
    this.notOldMatched = [];
    this.newMatched = [];
    this.notNewMatched = [];
  }
}


