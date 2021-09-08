import {EvalConfig} from '../../config/EvalConfig.js';
import fs from 'fs';
import xmldom from '@xmldom/xmldom';
import {execFileSync} from 'child_process';
import {Logger} from '../../util/Logger.js';
import {DomHelper} from '../../util/DomHelper.js';
import {ActualDiff} from '../actual/ActualDiff.js';
import {AbstractAdapter} from '../driver/AbstractAdapter.js';
import {AbstractTestResult} from '../result/AbstractTestResult.js';

/**
 * The superclass for all diff adapters that interface to existing XML
 * difference algorithms.
 */
export class DiffAdapter extends AbstractAdapter {
  /**
   * Construct a new DiffAdapter instance.
   * @param {String} path The path to the directory containing the XML diff
   *     algorithm and the run script
   * @param {String} displayName The name to display for the XML difference
   *     algorithm this adapter represents.
   */
  constructor(path, displayName) {
    super(path, displayName);
  }

  /**
   * @inheritDoc
   * @param {DiffTestCase} testCase The diff test case to run.
   * @return {DiffTestResult} The result.
   * @override
   */
  evalCase(testCase) {
    let exec;
    try {
      exec = this.run(testCase.oldTree, testCase.newTree);
    } catch (e) {
      // Timeout or runtime error?
      if (e.code === 'ETIMEDOUT') {
        Logger.info(this.displayName + ' timed out for ' + testCase.name, this);
        return testCase.complete(
            this.displayName,
            null,
            null,
            AbstractTestResult.VERDICTS.TIMEOUT,
        );
      } else {
        Logger.info(this.displayName + ' crashed for ' + testCase.name +
            ': ' + e.toString(), this);
        return testCase.complete(
            this.displayName,
            null,
            null,
            AbstractTestResult.VERDICTS.RUNTIME_ERROR,
        );
      }
    }
    const counters = this.parseOutput(exec.output);
    // A non-failure result is represented by OK. This does not indicate that
    // the algorithm performed well for the test case.
    return testCase.complete(
        this.displayName,
        exec.runtime,
        new ActualDiff(exec.output, ...counters),
        AbstractTestResult.VERDICTS.OK,
    );
  }

  /**
   * Parse the output produced by this XML difference algorithm to obtain the
   * types and amount of edit operations contained in the edit script as well
   * as its overall cost.
   * @param {String} output The raw output.
   * @return {[Number ,Number, Number, Number, Number]} [#Insertions, #Moves,
   *     #Updates, #Deletions, #Cost]
   */
  parseOutput(output) {
    let updates = 0;
    let insertions = 0;
    let moves = 0;
    let deletions = 0;

    // Assume conforming change model
    const delta = DomHelper.firstChildElement(
        new xmldom.DOMParser().parseFromString(output, 'text/xml'), 'delta');
    DomHelper.forAllChildElements(delta, (xmlOperation) => {
      switch (xmlOperation.localName) {
        case 'move':
          moves++;
          break;
        case 'add':
        case 'insert':
          // Map copies to insertions
        case 'copy':
          insertions++;
          break;
        case 'remove':
        case 'delete':
          deletions++;
          break;
        case 'update':
          updates++;
          break;
      }
    });
    const cost = insertions + moves + updates + deletions;
    return [
      insertions,
      moves,
      updates,
      deletions,
      cost,
    ];
  }

  /**
   * Run this XML difference algorithm with the provided process trees.
   * @param {Node} oldTree The root of the old (original) process tree.
   * @param {Node} newTree The root of the new (changed) process tree.
   * @return {{output: String, runtime: Number}} The raw output and elapsed
   *     time.
   */
  run(oldTree, newTree) {
    const oldTreeString = oldTree.toXmlString();
    const newTreeString = newTree.toXmlString();

    const oldFilePath = this.path + '/' + EvalConfig.FILENAMES.OLD_TREE;
    const newFilePath = this.path + '/' + EvalConfig.FILENAMES.NEW_TREE;

    fs.writeFileSync(oldFilePath, oldTreeString);
    fs.writeFileSync(newFilePath, newTreeString);

    const time = new Date().getTime();
    return {
      output: execFileSync(
          this.path + '/' + EvalConfig.FILENAMES.RUN_SCRIPT,
          [
            oldFilePath,
            newFilePath,
          ],
          EvalConfig.EXECUTION_OPTIONS,
      ).toString(),
      runtime: new Date().getTime() - time,
    };
  }
}


