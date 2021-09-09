import {EvalConfig} from '../../config/EvalConfig.js';
import {XccAdapter} from '../diff_adapters/XccAdapter.js';
import {XyDiffAdapter} from '../diff_adapters/XyDiffAdapter.js';
import {Logger} from '../../util/Logger.js';
import {DirectoryScraper} from '../case/DirectoryScraper.js';
import {DiffTestCase} from '../case/DiffTestCase.js';
import {DiffTestResult} from '../result/DiffTestResult.js';
import {markdownTable} from 'markdown-table';
import {AbstractEvaluation} from './AbstractEvaluation.js';
import {XmlDiffAdapter} from '../diff_adapters/XmlDiffAdapter.js';
import {DiffXmlAdapter} from '../diff_adapters/DiffXmlAdapter.js';
import * as fs from 'fs';
import {CpeeDiffAdapter} from '../diff_adapters/CpeeDiffAdapter.js';
import {MatchPipeline} from '../../diff/match/MatchPipeline.js';

/**
 * An evaluation of diff algorithms using predefined test cases.
 */
export class DiffEvaluation extends AbstractEvaluation {
  /**
   * Construct a new DiffEvaluation instance.
   * @param {Array<DiffAdapter>} adapters The adapters of the algorithms to use
   *     for the evaluation.
   */
  constructor(adapters = []) {
    super(adapters);
  }

  /**
   * Create a new DiffEvaluation instance that contains all algorithms.
   * @return {DiffEvaluation}
   */
  static all() {
    /** @type {Array<DiffAdapter>} */
    let adapters = [
      new XyDiffAdapter,
      new XccAdapter(),
      new XmlDiffAdapter(),
      new DiffXmlAdapter(),
    ];
    adapters = adapters.filter((adapter) =>
      fs.existsSync(adapter.path + '/' + EvalConfig.FILENAMES.RUN_SCRIPT));
    for (const matchMode of Object.values(MatchPipeline.MATCH_MODES)) {
      adapters.unshift(new CpeeDiffAdapter(matchMode));
    }
    return new DiffEvaluation(adapters);
  }

  /**
   * @inheritDoc
   * @param {String} rootDir The path to the directory containing the
   *     predefined diff test case directories. A diff test case directory at
   *     least includes an old and new process tree as XML documents.
   * @override
   */
  evalAll(rootDir) {
    Logger.section('Diff Evaluation with Cases from ' + rootDir, this);

    // Collect all directories representing testCases
    const caseDirs = DirectoryScraper.scrape(rootDir);
    for (const testCaseDir of caseDirs) {
      const testCase = DiffTestCase.from(testCaseDir);

      if (testCase == null) {
        Logger.warn('Skipping empty diff case directory ' + testCaseDir, this);
        continue;
      }

      const results = [];
      Logger.section('DIFF TEST CASE ' + testCase.name, this);
      for (const adapter of this._adapters) {
        Logger.info('Running diff case ' + testCase.name +
            ' for ' + adapter.displayName + '...', this);
        results.push(adapter.evalCase(testCase));
      }
      const table = [
        DiffTestResult.header(),
        testCase.expected.values(),
        ...results.map((result) => result.values()),
      ];
      Logger.result('Results for case ' + testCase.name + ':\n' +
          markdownTable(table), this);
    }
  }
}

