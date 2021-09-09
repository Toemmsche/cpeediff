import {AbstractTestResult} from './AbstractTestResult.js';

/**
 * An aggregate result summarizing multiple match test results.
 *
 * @see {MatchTestResult}
 */
export class AggregateMatchResult {
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
   * Construct a new AggregateMatchResult instance.
   * @param {String} algorithm The matching algorithm that produced the match
   *     results.
   * @param {Number} ok The amount of test results with the 'OK' verdict.
   * @param {Number} wrongAnswer The amount of test results with the 'WRONG
   *     ANSWER' verdict.
   * @param {Number} runtimeError The amount of test results with the 'RUNTIME
   *     ERROR' verdict.
   */
  constructor(
      algorithm,
      ok,
      wrongAnswer,
      runtimeError,
  ) {
    this.algorithm = algorithm;
    this.ok = ok;
    this.wrongAnswer = wrongAnswer;
    this.runtimeError = runtimeError;
  }

  /**
   * @return {Array<String>} The header row for a list of aggregate match
   *     results to use in tables.
   */
  static header() {
    return [
      'Algorithm',
      '#OK',
      '#Wrong Answer',
      '#Runtime Error',
    ];
  }

  /**
   * Create an AggregateMatchResult instance from a list of individual match
   * test results.
   * @param {Array<MatchTestResult>} results The list of match test results.
   * @return {AggregateMatchResult}
   */
  static of(results) {
    if (results.length === 0) {
      return null;
    }
    let ok = 0;
    let wrongAnswer = 0;
    let runtimeError = 0;
    for (const result of results) {
      if (result.verdict === AbstractTestResult.VERDICTS.OK) {
        ok++;
      } else if (result.verdict === AbstractTestResult.VERDICTS.WRONG_ANSWER) {
        wrongAnswer++;
      } else if (result.verdict === AbstractTestResult.VERDICTS.RUNTIME_ERROR) {
        runtimeError++;
      }
    }
    return new AggregateMatchResult(
        results[0].algorithm,
        ok,
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
      this.wrongAnswer,
      this.runtimeError,
    ];
  }
}


