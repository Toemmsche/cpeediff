/**
 * Abstract superclass for all individual test results.
 * @abstract
 */
export class AbstractTestResult {
  /**
   * Enum for all possible test case verdicts.
   * @type {Object}
   */
  static VERDICTS = {
    OK: 'OK',
    ACCEPTABLE: 'ACCEPTABLE',
    WRONG_ANSWER: 'WRONG ANSWER',
    RUNTIME_ERROR: 'RUNTIME ERROR',
    FAILED: 'FAILED',
    TIMEOUT: 'TIMEOUT',
  };

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
   * The actual result produced by the algorithm. Null indicates failure.
   * @type {?AbstractActual}
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
   * @param {?AbstractActual} actual The actual result produced by the
   *     algorithm. Null indicates failure.
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
    return this.verdict === AbstractTestResult.VERDICTS.OK &&
        this.actual != null;
  }

  /**
   * @return {Boolean} If this test result indicates a timeout.
   */
  isTimeOut() {
    return this.verdict === AbstractTestResult.VERDICTS.TIMEOUT;
  }

  /**
   * @return {Boolean} If this test result indicates a wrong answer.
   */
  isWrongAnswer() {
    return this.verdict === AbstractTestResult.VERDICTS.WRONG_ANSWER;
  }
}


