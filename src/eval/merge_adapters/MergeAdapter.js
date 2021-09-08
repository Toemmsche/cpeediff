import {execFileSync} from 'child_process';
import {EvalConfig} from '../../config/EvalConfig.js';
import fs from 'fs';
import {Preprocessor} from '../../io/Preprocessor.js';
import {HashExtractor} from '../../extract/HashExtractor.js';
import {Logger} from '../../util/Logger.js';
import {ActualMerge} from '../actual/ActualMerge.js';
import {AbstractAdapter} from '../driver/AbstractAdapter.js';
import {AbstractTestResult} from '../result/AbstractTestResult.js';

/**
 * Superclass for all adapters to merging algorithms.
 */
export class MergeAdapter extends AbstractAdapter {
  /**
   * Create a new MergeAdapter instance.
   * @param {String} path The path to the directory containing the merge
   *     algorithm and the run script
   * @param {String} displayName The name to display for the merge
   *     algorithm this adapter represents.
   */
  constructor(path, displayName) {
    super(path, displayName);
  }

  /**
   * @inheritDoc
   * @param {MergeTestCase} testCase The merge test case to run.
   * @return {MergeTestResult} The result.
   */
  evalCase(testCase) {
    let exec;
    try {
      exec = this.run(testCase.base, testCase.branch1, testCase.branch2);
    } catch (e) {
      // check if timeout or runtime error
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
    const parser = new Preprocessor();
    const actual = new ActualMerge(
        exec,
        parser.fromString(exec),
    );
    const verdict = this.verifyResult(actual, testCase.expected);

    if (verdict === AbstractTestResult.VERDICTS.WRONG_ANSWER) {
      Logger.info(
          this.displayName + ' gave wrong answer for ' + testCase.name,
          this,
      );
    }
    return testCase.complete(this.displayName, actual, verdict);
  }

  /**
   * Run this three-way merge algorithm.
   * @param {Node} base The root of the base process tree.
   * @param {Node} branch1 The root of the first branch process tree.
   * @param {Node} branch2 The root of the second branch process tree.
   * @return {String} The merge result as an XML document.
   */
  run(base, branch1, branch2) {
    const baseString = base.toXmlString();
    const branch1String = branch1.toXmlString();
    const branch2String = branch2.toXmlString();

    const baseFilePath = this.path + '/base.xml';
    const branch1Filepath = this.path + '/1.xml';
    const branch2FilePath = this.path + '/2.xml';

    fs.writeFileSync(baseFilePath, baseString);
    fs.writeFileSync(branch1Filepath, branch1String);
    fs.writeFileSync(branch2FilePath, branch2String);

    return execFileSync(
        this.path + '/' + EvalConfig.FILENAMES.RUN_SCRIPT,
        [
          baseFilePath,
          branch1Filepath,
          branch2FilePath,
        ],
        EvalConfig.EXECUTION_OPTIONS,
    ).toString();
  }

  /**
   * Verify that an actual merge result matches the expected result.
   * @param {ActualMerge} actualMerge The actual merge result.
   * @param {ExpectedMerge} expectedMerge The expected merge result.
   * @return {String} The verdict
   */
  verifyResult(actualMerge, expectedMerge) {
    const actualTree = actualMerge.tree;
    const hashExtractor = new HashExtractor();
    if (expectedMerge.expectedTrees.some((tree) =>
        hashExtractor.get(tree) === hashExtractor.get(actualTree))) {
      return AbstractTestResult.VERDICTS.OK;
    } else if (expectedMerge.acceptedTrees.some((tree) =>
        hashExtractor.get(tree) === hashExtractor.get(actualTree))) {
      return AbstractTestResult.VERDICTS.ACCEPTABLE;
    } else {
      return AbstractTestResult.VERDICTS.WRONG_ANSWER;
    }
  }
}


