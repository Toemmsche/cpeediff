import {EvalConfig} from '../EvalConfig.js';

/**
 * Abstract superclass for all individual test results.
 * @abstract
 */
export class AbstractTestResult {
  /**
   * The name (or ID) of the test case.
   * @type {String}
   * @const
   */
  caseName;
  /**
   * The name of the algorithm that produced this result.
   * @type {String}
   * @const
   */
  algorithm;
  /**
   * The actual result produced by the algorithm.
   * @type {AbstractActual}
   * @const
   */
  actual;
  /**
   * The verdict for this test case.
   * @type {String}
   * @const
   */
  verdict;

  /**
   * Construct a new AbstractTestResult instance.
   * @param {String} caseName The name (or ID) of the test case.
   * @param {String} algorithm The name of the algorithm that produced this
   *     result.
   * @param {AbstractActual} actual The actual result produced by the
   *     algorithm.
   * @param {String} verdict The verdict for this test case.
   */
  constructor(
      caseName,
      algorithm,
      actual,
      verdict,
  ) {
    this.caseName = caseName;
    this.algorithm = algorithm;
    this.actual = actual;
    this.verdict = verdict;
  }

  /**
   * @return {Boolean} If this test result indicates success.
   */
  isOk() {
    return this.verdict === EvalConfig.VERDICTS.OK;
  }
}


