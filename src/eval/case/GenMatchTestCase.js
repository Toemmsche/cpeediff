import {AbstractTestCase} from './AbstractTestCase.js';
import {MatchTestResult} from '../result/MatchTestResult.js';

/**
 * Represents a test case for the evaluation of matching algorithms with
 * generated process trees.
 */
export class GenMatchTestCase extends AbstractTestCase {
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
   * Construct a new GenMatchTestCase instance.
   * @param {String} name The name of this test case
   * @param {Node} oldTree The root of the original process tree
   * @param {Node} newTree The root of the changed process tree
   * @param {ExpectedGenMatching} expected The Expected matching
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
   * @return {GenMatchTestResult} The corresponding result
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
}


