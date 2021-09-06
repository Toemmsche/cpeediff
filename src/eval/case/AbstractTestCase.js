import {Logger} from '../../util/Logger.js';

/**
 * Abstract superclass for all test cases.
 * @abstract
 */
export class AbstractTestCase {
  /**
   * The name of the this test case.
   * @type {String}
   * @const
   */
  name;
  /**
   * The expected result.
   * @type {AbstractExpected}
   * @const
   */
  expected;

  /**
   * Create a new AbstractTestCase instance.
   * @param {String} name The name of this test case
   * @param {AbstractExpected} expected The expected result for this test case
   */
  constructor(name, expected) {
    this.name = name;
    this.expected = expected;
  }

  /**
   * Construct a diff test case from a test case directory.
   * @param {String} testCaseDir An absolute or relative path to the test case
   *     directory
   * @return {AbstractTestCase} The constructed test case
   * @abstract
   */
  static from(testCaseDir) {
    Logger.abstractMethodExecution();
  }

  /**
   * Complete this test case.
   * @param {String} algorithm The algorithm that ran this case.
   * @param {?AbstractActual} actual The actual output. Null indicates failure.
   * @param {String} verdict The verdict for this test case and algorithm.
   * @return {AbstractTestResult} The corresponding result.
   * @abstract
   */
  complete(algorithm, actual, verdict) {
    Logger.abstractMethodExecution();
  }
}
