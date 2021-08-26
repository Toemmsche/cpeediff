import {AbstractExpected} from './AbstractExpected.js';

/**
 * The expected output of a merge algorithm.
 */
export class ExpectedMerge extends AbstractExpected {
  /**
   * A list of the roots of merge process trees that lead to the OK verdict.
   * @type {Array<Node>}
   * @const
   */
  expectedTrees;
  /**
   * A list of the roots of merge process trees that lead to the ACCEPTABLE
   * verdict.
   * @type {Array<Node>}
   * @const
   */
  acceptedTrees;

  /**
   * Construct a new ExpectedMerge instance.
   * @param {Array<Node>} expectedTrees A list of the roots of merge process
   *     trees that lead to the OK verdict.
   * @param {Array<Node>} acceptedTrees A list of the roots of merge process
   *     trees that lead to the ACCEPTABLE verdict.
   */
  constructor(expectedTrees, acceptedTrees) {
    super();
    this.expectedTrees = expectedTrees;
    this.acceptedTrees = acceptedTrees;
  }
}
