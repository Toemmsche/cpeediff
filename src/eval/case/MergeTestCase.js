import {AbstractTestCase} from './AbstractTestCase.js';
import {EvalConfig} from '../../config/EvalConfig.js';
import {MergeTestResult} from '../result/MergeTestResult.js';
import fs from 'fs';
import {Preprocessor} from '../../io/Preprocessor.js';
import {ExpectedMerge} from '../expected/ExpectedMerge.js';

/**
 * Represents a test case for the evaluation of merging algorithms.
 */
export class MergeTestCase extends AbstractTestCase {
  /**
   * The root the base process tree.
   * @type {Node}
   * @const
   */
  base;
  /**
   * The root the first branch process tree.
   * @type {Node}
   * @const
   */
  branch1;
  /**
   * The root the second branch process tree.
   * @type {Node}
   * @const
   */
  branch2;

  /**
   * Construct a new MergeTestCase instance.
   * @param {String} name The name of the test case
   * @param {Node} base The root of the base process tree
   * @param {Node} branch1 The root of the first branch process tree#
   * @param {Node} branch2 The root of the second branch process tree
   * @param {ExpectedMerge} expected The expected merge results
   */
  constructor(
      name,
      base,
      branch1,
      branch2,
      expected,
  ) {
    super(name, expected);
    this.base = base;
    this.branch1 = branch1;
    this.branch2 = branch2;
  }

  /**
   * Construct a merge test case from a test case directory.
   * @param {String} testCaseDir An absolute or relative path to the test case
   *     directory
   * @return {MergeTestCase} The constructed merge test case
   * @override
   */
  static from(testCaseDir) {
    const parser = new Preprocessor();
    const testCaseName = testCaseDir.split('/').pop();
    let base;
    let branch1;
    let branch2;
    const expected = [];
    const accepted = [];

    fs.readdirSync(testCaseDir).forEach((file) => {
      const filePath = testCaseDir + '/' + file;
      if (file === EvalConfig.FILENAMES.BASE) {
        base = parser.fromFile(filePath);
      } else if (file === EvalConfig.FILENAMES.BRANCH_1) {
        branch1 = parser.fromFile(filePath);
      } else if (file === EvalConfig.FILENAMES.BRANCH_2) {
        branch2 = parser.fromFile(filePath);
      } else if (file.startsWith(EvalConfig.FILENAMES.EXPECTED_MERGE_PREFIX)) {
        expected.push(parser.fromFile(filePath));
      } else if (file.startsWith(EvalConfig.FILENAMES.ACCEPTED_MERGE_PREFIX)) {
        accepted.push(parser.fromFile(filePath));
      }
    });
    return new MergeTestCase(
        testCaseName,
        base,
        branch1,
        branch2,
        new ExpectedMerge(expected, accepted),
    );
  }

  /**
   * Complete this test case.
   * @param {String} algorithm The algorithm that ran this case
   * @param {?ActualMerge} actual The merge produced by the algorithm, null
   *     indicates failure
   * @param {String} verdict The verdict for this test case and algorithm
   * @return {MergeTestResult} The corresponding result
   * @override
   */
  complete(algorithm, actual = null, verdict) {
    return new MergeTestResult(
        this.name,
        algorithm,
        actual,
        verdict,
    );
  }
}


