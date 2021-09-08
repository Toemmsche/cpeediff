import {AbstractTestCase} from './AbstractTestCase.js';
import fs from 'fs';
import {EvalConfig} from '../../config/EvalConfig.js';
import {ExpectedDiff} from '../expected/ExpectedDiff.js';
import {Preprocessor} from '../../io/Preprocessor.js';
import {DiffTestResult} from '../result/DiffTestResult.js';

/**
 * Represents a test case for the evaluation of diff algorithms.
 */
export class DiffTestCase extends AbstractTestCase {
  /**
   * The root of the original (old) process tree.
   * @type {Node}
   * @const
   */
  oldTree;
  /**
   * The root of the changed (new) process tree.
   * @type {Node}
   * @const
   */
  newTree;

  /**
   * Construct a new DiffTestCase instance.
   * @param {String} name The name of this test case.
   * @param {Node} oldTree The root of the original process tree.
   * @param {Node} newTree The root of the changed process tree.
   * @param {ExpectedDiff} expected The expected result.
   */
  constructor(
      name,
      oldTree,
      newTree,
      expected,
  ) {
    super(name, expected);
    this.oldTree = oldTree;
    this.newTree = newTree;
  }

  /**
   * Construct a diff test case from a test case directory.
   * @param {String} testCaseDir An absolute or relative path to the test case
   *     directory
   * @return {DiffTestCase} The constructed diff test case
   * @override
   */
  static from(testCaseDir) {
    const testCaseName = testCaseDir.split('/').pop();
    let oldTree;
    let newTree;
    let expected;

    // Regular test case definition
    const parser = new Preprocessor();
    fs.readdirSync(testCaseDir).forEach((file) => {
      const filePath= testCaseDir + '/' + file;
      if (file === EvalConfig.FILENAMES.NEW_TREE) {
        newTree = parser.fromFile(filePath);
      } else if (file === EvalConfig.FILENAMES.OLD_TREE) {
        oldTree = parser.fromFile(filePath);
      }
    });
    // The two process trees are the bare minimum needed for a test case
    if (oldTree == null || newTree == null) {
      return null;
    }
    if (expected == null) {
      expected = new ExpectedDiff();
    }
    return new DiffTestCase(
        testCaseName,
        oldTree,
        newTree,
        expected,
    );
  }

  /**
   * Complete this test case.
   * @param {String} algorithm The algorithm that ran this case.
   * @param {Number} runtime The time (in ms) the algorithm took to complete
   *     the case.
   * @param {?ActualDiff} actual The diff produced by the algorithm, null
   *     indicates failure.
   * @param {String} verdict The verdict for this test case and algorithm.
   * @return {DiffTestResult} The corresponding result.
   * @override
   */
  complete(
      algorithm,
      runtime,
      actual = null,
      verdict,
  ) {
    return new DiffTestResult(
        this.name,
        algorithm,
        runtime,
        actual,
        verdict,
    );
  }
}
