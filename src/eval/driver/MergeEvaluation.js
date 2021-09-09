import {EvalConfig} from '../../config/EvalConfig.js';
import * as fs from 'fs';
import {AggregateMergeResult} from '../result/AggregateMergeResult.js';
import {_3dmAdapter} from '../merge_adapters/_3dmAdapter.js';
import {CpeeMergeAdapter} from '../merge_adapters/CpeeMergeAdapter.js';
import {XccPatchAdapter} from '../merge_adapters/XccPatchAdapter.js';
import {Logger} from '../../util/Logger.js';
import {DirectoryScraper} from '../case/DirectoryScraper.js';
import {MergeTestCase} from '../case/MergeTestCase.js';
import {AbstractEvaluation} from './AbstractEvaluation.js';
import {markdownTable} from 'markdown-table';

/**
 * An evaluation of three-way merging algorithms using predefined test cases.
 */
export class MergeEvaluation extends AbstractEvaluation {
  /**
   * Create a new MergeEvaluation instance.
   * @param {Array<MergeAdapter>} adapters The adapters of the algorithms to be
   *     used for the evaluation.
   */
  constructor(adapters = []) {
    super(adapters);
  }

  /**
   * Create a new MergeEvaluation instance with all available merge algorithms.
   * @return {MergeEvaluation}
   */
  static all() {
    /** @type {Array<MergeAdapter>} */
    let adapters = [
      new _3dmAdapter(),
      new XccPatchAdapter(),
    ];
    adapters = adapters.filter((adapter) =>
        fs.existsSync(adapter.path + '/' + EvalConfig.FILENAMES.RUN_SCRIPT));
    adapters.unshift(new CpeeMergeAdapter());
    return new MergeEvaluation(adapters);
  }

  /**
   * @inheritDoc
   * @param {String} rootDir The path to the directory containing the
   *     predefined merge test case directories. A merge test case directory
   *     includes a base  process tree and two branch process trees.
   * @override
   */
  evalAll(rootDir) {
    Logger.section('Merge Evaluation with Cases from ' + rootDir, this);

    const resultsPerAdapter = new Map();
    for (const adapter of this._adapters) {
      resultsPerAdapter.set(adapter, []);
    }

    // Collect all test case directories
    const caseDirs = DirectoryScraper.scrape(rootDir);
    for (const testCaseDir of caseDirs) {
      const testCase = MergeTestCase.from(testCaseDir);

      if (testCase == null) {
        Logger.warn('Skipping empty merge case directory' + testCaseDir, this);
        continue;
      }

      for (const adapter of this._adapters) {
        Logger.info(
            'Running merge case ' + testCase.name +
            ' for ' + adapter.displayName + '...',
            this,
        );

        const result = adapter.evalCase(testCase);
        resultsPerAdapter.get(adapter).push(result);
      }
    }

    const aggregateResults = [];
    for (const [, resultsList] of resultsPerAdapter) {
      aggregateResults.push(AggregateMergeResult.of(resultsList));
    }
    const table = [
      AggregateMergeResult.header(),
      ...aggregateResults.map((result) => result.values()),
    ];
    Logger.result('Results of the merge evaluation:\n' +
        markdownTable(table), this);
  }
}
