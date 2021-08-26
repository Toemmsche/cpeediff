import {AbstractTestCase} from './AbstractTestCase.js';
import {EvalConfig} from '../EvalConfig.js';
import {MatchTestResult} from '../result/MatchTestResult.js';
import fs from 'fs';
import {ExpectedMatch} from '../expected/ExpectedMatch.js';
import {Preprocessor} from '../../src/io/Preprocessor.js';

/**
 * Represents a test case for the evaluation of matching algorithms.
 */
export class MatchTestCase extends AbstractTestCase {
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
   * Construct a new MatchTestCase instance.
   * @param {String} name The name of this test case
   * @param {Node} oldTree The root of the original process tree
   * @param {Node} newTree The root of the changed process tree
   * @param {ExpectedMatch} expected Rules for the expected matching
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
   * Complete this test case.
   * @param {String} algorithm The algorithm that ran this case
   * @param {?ActualMatching} actual The matching produced by the
   *     algorithm, null indicates failure
   * @param {String} verdict The verdict for this test case and algorithm
   * @return {MatchTestResult} The corresponding result
   * @override
   */
  complete(algorithm, actual = null, verdict) {
    return new MatchTestResult(
        this.name,
        algorithm,
        actual,
        verdict,
    );
  }

  /**
   * Construct a match test case from a test case directory.
   * @param {String} testCaseDir An absolute or relative path to the test case
   *     directory
   * @return {MatchTestCase} The constructed match test case
   * @override
   */
  static from(testCaseDir) {
    const testCaseName = testCaseDir.split('/').pop();

    const parser = new Preprocessor();
    let oldTree;
    let newTree;
    let expected;
    fs.readdirSync(testCaseDir).forEach((file) => {
      const content = fs.readFileSync(testCaseDir + '/' + file).toString();
      if (file === EvalConfig.FILENAMES.NEW_TREE) {
        newTree = parser.parseWithMetadata(content);
      } else if (file === EvalConfig.FILENAMES.OLD_TREE) {
        oldTree = parser.parseWithMetadata(content);
      } else if (file === EvalConfig.FILENAMES.EXPECTED_MATCHES) {
        expected = Object.assign(new ExpectedMatch(), JSON.parse(content));
      }
    });
    return new MatchTestCase(
        testCaseName,
        oldTree,
        newTree,
        expected,
    );
  }
}


