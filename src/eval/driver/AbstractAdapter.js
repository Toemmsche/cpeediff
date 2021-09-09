import {Logger} from '../../util/Logger.js';
import {fileURLToPath} from 'url';
import {dirname} from 'path';

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
    // Adjust relative directory paths
    const currFile = fileURLToPath(import.meta.url);
    const currDirectory = dirname(currFile);
    // project root is three folders upstream
    this.path = currDirectory + '/../../../' + path;
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
    return null;
  }
}
