import {AbstractTestResult} from './AbstractTestResult.js';

/**
 * The result for a match test case.
 */
export class MatchTestResult extends AbstractTestResult {

  /**
   * Construct a new MatchTestResult instance.
   * @param {String} caseName The name of the corresponding match test case.
   * @param {String} algorithm The name of the algorithm that produced the
   *     matching.
   * @param {?ActualMatching} actual The actual matching produced by the
   *     algorithm. Null indicates failure.
   * @param {String} verdict The verdict for this match result.
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


