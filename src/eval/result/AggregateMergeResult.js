/**
 * An aggregate result summarizing multiple merge test results.
 *
 * @see {MergeTestResult}
 */
import {AbstractTestResult} from './AbstractTestResult.js';

export class AggregateMergeResult {
  /**
   * The matching algorithm that produced the match results.
   * @type {String}
   * @const
   */
  algorithm;
  /**
   * The amount of test results with the 'OK' verdict.
   * @type {Number}
   * @const
   */
  ok;
  /**
   * The amount of test results with the 'ACCEPTABLE' verdict.
   * @type {Number}
   * @const
   */
  acceptable;
  /**
   * The amount of test results with the 'WRONG ANSWER' verdict.
   * @type {Number}
   * @const
   */
  wrongAnswer;
  /**
   * The amount of test results with the 'RUNTIME ERROR' verdict.
   * @type {Number}
   * @const
   */
  runtimeError;

  /**
   * Construct a new AggregateMergeResult instance.
   * @param {String} algorithm The matching algorithm that produced the match
   *     results.
   * @param {Number} ok The amount of test results with the 'OK' verdict.
   * @param {Number} acceptable The amount of test results with the
   *     'ACCEPTABLE' verdict.
   * @param {Number} wrongAnswer The amount of test results with the 'WRONG
   *     ANSWER' verdict.
   * @param {Number} runtimeError The amount of test results with the 'RUNTIME
   *     ERROR' verdict.
   */
  constructor(
      algorithm,
      ok,
      acceptable,
      wrongAnswer,
      runtimeError,
  ) {
    this.algorithm = algorithm;
    this.ok = ok;
    this.acceptable = acceptable;
    this.wrongAnswer = wrongAnswer;
    this.runtimeError = runtimeError;
  }

  /**
   * @return {Array<String>} The header row for a list of aggregate merge
   *     results to use in tables.
   */
  static header() {
    return [
      'Algorithm',
      '#OK',
      '#Acceptable',
      '#Wrong Answer',
      '#Runtime Error',
    ];
  }

  /**
   * Create an AggregateMergeResult instance from a list of individual merge
   * test results.
   * @param {Array<MergeTestResult>} results The list of merge test results.
   * @return {AggregateMergeResult}
   */
  static of(results) {
    if (results.length === 0) {
      return null;
    }
    const algorithm = results[0].algorithm;
    let ok = 0;
    let acceptable = 0;
    let wrongAnswer = 0;
    let runtimeError = 0;
    for (const result of results) {
      if (result.verdict === AbstractTestResult.VERDICTS.OK) {
        ok++;
      } else if (result.verdict === AbstractTestResult.VERDICTS.ACCEPTABLE) {
        acceptable++;
      } else if (result.verdict === AbstractTestResult.VERDICTS.WRONG_ANSWER) {
        wrongAnswer++;
      } else if (result.verdict === AbstractTestResult.VERDICTS.RUNTIME_ERROR) {
        runtimeError++;
      }
    }

    return new AggregateMergeResult(
        algorithm,
        ok,
        acceptable,
        wrongAnswer,
        runtimeError,
    );
  }

  /**
   * @return {Array<String>} The row of values of this result for use in tables.
   */
  values() {
    return [
      this.algorithm,
      this.ok,
      this.acceptable,
      this.wrongAnswer,
      this.runtimeError,
    ];
  }
}


