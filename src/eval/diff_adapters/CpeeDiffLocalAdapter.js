import {CpeeDiff} from '../../diff/CpeeDiff.js';
import {DiffAdapter} from './DiffAdapter.js';
import {EvalConfig} from '../../config/EvalConfig.js';
import {Logger} from '../../util/Logger.js';
import {ActualDiff} from '../actual/ActualDiff.js';
import {MatchPipeline} from '../../diff/match/MatchPipeline.js';
import {DiffConfig} from '../../config/DiffConfig.js';
import {AbstractTestResult} from '../result/AbstractTestResult.js';

/**
 * Diff adapter for CpeeDiff that runs the diff algorithm from this process.
 */
export class CpeeDiffLocalAdapter extends DiffAdapter {
  /**
   * The matching mode to use.
   * @type {String}
   * @private
   */
  #mode;

  /**
   * Construct a new CpeeDiffLocalAdapter instance.
   * @param {String} mode The matching mode to use. "quality" by default.
   */
  constructor(mode = MatchPipeline.MATCH_MODES.QUALITY) {
    super('', EvalConfig.DIFFS.CPEEDIFF.displayName + '_local_' + mode);
    this.#mode = mode;
  }

  /**
   * @inheritDoc
   * @return {DiffTestResult} The diff test result.
   * @override
   */
  evalCase(testCase) {
    let exec;
    try {
      exec = this.run(testCase.oldTree, testCase.newTree);
    } catch (e) {
      //check if timeout or runtime error
      if (e.code === 'ETIMEDOUT') {
        Logger.info(this.displayName + ' timed out for ' +
            testCase.name, this);
        return testCase.complete(
            this.displayName,
            null,
            null,
            AbstractTestResult.VERDICTS.TIMEOUT,
        );
      } else {
        Logger.info(
            this.displayName + ' crashed for ' +
            testCase.name + ': ' + e.toString(),
            this,
        );
        return testCase.complete(
            this.displayName,
            null,
            null,
            AbstractTestResult.VERDICTS.RUNTIME_ERROR,
        );
      }
    }
    const counters = this.parseOutput(exec.output);
    // An OK verdict is emitted because the diff algorithm didnt fail
    return testCase.complete(
        this.displayName,
        exec.runtime,
        new ActualDiff(exec.output.toXmlString(), ...counters),
        AbstractTestResult.VERDICTS.OK,
    );
  }

  /**
   * @inheritDoc
   * @param {EditScript} output
   * @Override
   */
  parseOutput(output) {
    return [
      output.insertions(),
      output.moves(),
      output.updates(),
      output.deletions(),
      output.cost,
    ];
  }

  /**
   * @inheritDoc
   * @return {{output: EditScript, runtime: Number}}
   * @Override
   */
  run(oldTree, newTree) {
    let time = new Date().getTime();
    DiffConfig.MATCH_MODE = this.#mode;
    const editScript =
        new CpeeDiff(MatchPipeline.fromMode()).diff(oldTree, newTree);
    time = new Date().getTime() - time;
    return {
      output: editScript,
      runtime: time,
    };
  }
}


