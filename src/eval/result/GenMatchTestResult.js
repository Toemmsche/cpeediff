import {AbstractTestResult} from './AbstractTestResult.js';

/**
 * The result for a match test case containing generated process trees.
 */
export class GenMatchTestResult extends AbstractTestResult {

  /**
   * The time (in ms) it took to produced the result. Null indicates failure.
   * @type {?Number}
   * @const
   */
  runtime;
  /**
   * The commonality between the expected and actual matching as a comparison
   * value.
   * @type {Number}
   * @const
   */
  commonality;
  /**
   * The number of mismatched leaves.
   * @type {Number}
   * @const
   */
  mismatchedLeaves;
  /**
   * The number of mismatched inner nodes.
   * @type {Number}
   * @const
   */
  mismatchedInners;
  /**
   * The number of leaves that are matched in the expected, but not the actual,
   * matching.
   * @type {Number}
   * @const
   */
  unmatchedLeaves;
  /**
   * The number of inner nodes that are matched in the expected, but not the
   * actual, matching.
   * @type {Number}
   * @const
   */
  unmatchedInners;

  /**
   * Construct a new GenMatchTestResult instance.
   @param {String} caseName The name of the corresponding diff test case.
   * @param {String} algorithm The name of the algorithm that produced the
   *     matching.
   * @param {Number} runtime The time (in ms) it took to produced the result.
   *     Null indicates failure.
   * @param {?ActualMatching} actual The actual matching produced by the
   *     algorithm. Null indicates failure.
   * @param {String} verdict The verdict for this gen match result.
   * @param {Number} commonality The commonality between the expected and
   *     actual matching as a comparison value.
   * @param {Number} mismatchedLeaves The number of mismatched leaves.
   * @param {Number} mismatchedInners The number of mismatched inner nodes.
   * @param {Number} unmatchedLeaves The number of leaves that are matched in
   *     the expected, but not the actual, matching.
   * @param {Number} unmatchedInners The number of inner nodes that are matched
   *     in the expected, but not the actual, matching.
   */
  constructor(
      caseName,
      algorithm,
      runtime,
      actual,
      verdict,
      commonality,
      mismatchedLeaves,
      mismatchedInners,
      unmatchedLeaves,
      unmatchedInners,
  ) {
    super(
        caseName,
        algorithm,
        actual,
        verdict,
    );
    this.runtime = runtime;
    this.mismatchedInners = mismatchedInners;
    this.mismatchedLeaves = mismatchedLeaves;
    this.commonality = commonality;
    this.unmatchedLeaves = unmatchedLeaves;
    this.unmatchedInners = unmatchedInners;
  }

  /**
   * @return {Array<String>} The header row for a list of gen match test
   *     results to use in tables.
   */
  static header() {
    return [
      'Algorithm',
      'Runtime',
      'Commonality',
      'Mismatched Leaves',
      'Mismatched Inners',
      'Unmatched Leaves',
      'Unmatched Inners',
    ];
  }

  /**
   * @return {Array<String>} The row of values of this result for use in tables.
   */
  values() {
    // A non-OK verdict indicates failure, fill the  array with it
    if (!this.isOk()) {
      return [
        this.algorithm,
        ...(new Array(GenMatchTestResult.header().length - 1)
            .fill(this.verdict)),
      ];
    }
    return [
      this.algorithm,
      this.runtime,
      this.commonality,
      this.mismatchedLeaves,
      this.unmatchedInners,
      this.unmatchedLeaves,
      this.unmatchedInners,
    ];
  }
}

