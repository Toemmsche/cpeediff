import {AbstractTestResult} from './AbstractTestResult.js';

/**
 * The result for a merge test case.
 */
export class MergeTestResult extends AbstractTestResult {

  /**
   * Construct a new MergeTestResult instance.
   * @param {String} caseName The name of the corresponding merge test case.
   * @param {String} algorithm The name of the algorithm that produced the
   *     merge.
   * @param {?ActualMerge} actual The actual merge produced by the algorithm.
   *     Null indicates failure.
   * @param {String} verdict The verdict for this merge result.
   */
  constructor(
      caseName,
      algorithm,
      actual,
      verdict,
  ) {
    super(
        caseName,
        algorithm,
        actual,
        verdict,
    );
  }
}


