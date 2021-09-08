import {IdExtractor} from '../../extract/IdExtractor.js';
import assert from 'assert';
import {Logger} from '../../util/Logger.js';
import {ActualMatching} from '../actual/ActualMatching.js';
import {AbstractAdapter} from '../driver/AbstractAdapter.js';
import {AbstractTestResult} from '../result/AbstractTestResult.js';

/**
 * The superclass for all adapters to matching algorithms.
 */
export class MatchAdapter extends AbstractAdapter {
  /**
   * Construct a new MatchAdapter instance.
   * @param {String} path The path to the directory containing the matching
   *     algorithm and the run script
   * @param {String} displayName The name to display for the matching
   *     algorithm this adapter represents.
   */
  constructor(path, displayName) {
    super(path, displayName);
  }

  /**
   * @inheritDoc
   * @param {MatchTestCase} testCase The diff test case to run.
   * @return {MatchTestResult} The result.
   */
  evalCase(testCase) {
    let matching;
    try {
      matching = this.run(testCase.oldTree, testCase.newTree);
    } catch (e) {
      // Check if timeout or runtime error
      if (e.code === 'ETIMEDOUT') {
        Logger.info(this.displayName + ' timed out for ' + testCase.name, this);
        return testCase.complete(
            this.displayName,
            null,
            AbstractTestResult.VERDICTS.TIMEOUT,
        );
      } else {
        Logger.info(
            this.displayName + ' crashed on ' + testCase.name +
            ': ' + e.toString(),
            this,
        );
        return testCase.complete(
            this.displayName,
            null,
            AbstractTestResult.VERDICTS.RUNTIME_ERROR,
        );
      }
    }
    try {
      this.verifyResult(matching, testCase.expected);
    } catch (e) {
      Logger.info(
          this.displayName + ' gave wrong answer for ' +
          testCase.name + ': ' + e.toString(),
          this,
      );
      return testCase.complete(
          this.displayName,
          new ActualMatching(null, matching),
          AbstractTestResult.VERDICTS.WRONG_ANSWER,
      );
    }
    return testCase.complete(
        this.displayName,
        new ActualMatching(null, matching),
        AbstractTestResult.VERDICTS.OK,
    );
  }

  /**
   * Run this matching algorithm.
   * @param {Node} oldTree The root of the old (original) tree.
   * @param {Node} newTree The root of the new (changed) tree.
   * @return {Matching} The produced matching.
   * @abstract
   */
  run(oldTree, newTree) {
    Logger.abstractMethodExecution();
  }

  /**
   * Verify that an actual matching follows the rules of the expected matching.
   * @param {Matching} matching The actual matching produced by the algorithm.
   * @param {ExpectedMatching} expected Rules for the expected matching.
   * @throws {Error} If the actual matching does not conform to the rules of
   *     the expected.
   */
  verifyResult(matching, expected) {
    const oldToNewIdMap = new Map();
    const newToOldIdMap = new Map();

    // Extract IDs of matched nodes
    const idExtractor = new IdExtractor();
    for (const [oldNode, newNode] of matching.oldToNewMap) {
      oldToNewIdMap.set(idExtractor.get(oldNode), idExtractor.get(newNode));
    }
    for (const [newNode, oldNode] of matching.newToOldMap) {
      newToOldIdMap.set(idExtractor.get(newNode), idExtractor.get(oldNode));
    }

    // verify that matching meets the expected results

    for (const matchPair of expected.matches) {
      const oldId = matchPair[0];
      const newId = matchPair[1];
      assert.ok(
          oldToNewIdMap.has(oldId),
          'old node ' + oldId + ' is not matched',
      );
      assert.strictEqual(
          oldToNewIdMap.get(oldId),
          newId,
          'old node ' + oldId + ' is matched with ' +
          oldToNewIdMap.get(oldId) + ' instead of ' + newId,
      );
    }

    for (const notMatchPair of expected.notMatches) {
      const oldId = notMatchPair[0];
      const newId = notMatchPair[1];
      if (oldToNewIdMap.has(oldId)) {
        assert.notStrictEqual(
            oldToNewIdMap.get(oldId),
            newId,
            'old node ' + oldId + ' is wrongfully matched with ' + newId,
        );
      }
    }

    for (const oldId of expected.oldMatched) {
      assert.ok(
          oldToNewIdMap.has(oldId),
          'old node ' + oldId + ' is not matched',
      );
    }

    for (const newId of expected.newMatched) {
      assert.ok(
          newToOldIdMap.has(newId),
          'mew node ' + newId + ' is not matched',
      );
    }

    for (const oldId of expected.notOldMatched) {
      assert.ok(
          !oldToNewIdMap.has(oldId),
          'old node ' + oldId + ' is wrongfully matched',
      );
    }

    for (const newId of expected.notNewMatched) {
      assert.ok(
          !newToOldIdMap.has(newId),
          'mew node ' + newId + ' is wrongfully matched',
      );
    }
  }
}


