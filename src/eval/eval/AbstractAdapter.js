import {Logger} from '../../util/Logger.js';

/**
 * Abstract superclass for all adapters to some form of algorithm (match, diff,
 * merge).
 * @abstract
 */
export class AbstractAdapter {
  /**
   * The path to the directory containing the algorithm and the run
   * script.
   * @type {String}
   * @protected
   * @const
   */
  path;

  /**
   * The name to display for the algorithm this adapter represents.
   * @type {String}
   * @const
   */
  displayName;

  /**
   * Construct a new AbstractAdapter instance.
   * @param {String} path The path to the directory containing the algorithm
   *     and the run script
   * @param {String} displayName The name to display for the algorithm this
   *     adapter represents.
   */
  constructor(path, displayName) {
    this.path = path;
    this.displayName = displayName;
  }

  /**
   * Evaluate a single test case with the algorithm this adapter represents.
   * @param {AbstractTestCase} testCase The test case to run.
   * @return {AbstractTestResult} The result.
   * @abstract
   */
  evalCase(testCase) {
    Logger.abstractMethodExecution();
  }
}
