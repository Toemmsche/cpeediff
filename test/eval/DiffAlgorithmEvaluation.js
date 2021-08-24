/*
    Copyright 2021 Tom Papke

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

import {TestConfig} from '../TestConfig.js';
import * as fs from 'fs';
import {DeltaJsAdapter} from '../diff_adapters/DeltaJsAdapter.js';
import {XccAdapter} from '../diff_adapters/XccAdapter.js';
import {XyDiffAdapter} from '../diff_adapters/XyDiffAdapter.js';
import {Logger} from '../../util/Logger.js';
import {DirectoryScraper} from '../../util/DirectoryScraper.js';
import {DiffTestCase} from '../case/DiffTestCase.js';
import {DiffTestResult} from '../result/DiffTestResult.js';
import {markdownTable} from 'markdown-table';
import {FastCpeeDiffAdapter} from '../diff_adapters/FastCpeeDiffAdapter.js';
import {AbstractEvaluation} from './AbstractEvaluation.js';

export class DiffAlgorithmEvaluation extends AbstractEvaluation {

  constructor(adapters = []) {
    super(adapters);
  }

  static all() {
    return new DiffAlgorithmEvaluation(this.diffAdapters());
  }

  static fast() {
    let adapters = [new XyDiffAdapter(), new DeltaJsAdapter(), new XccAdapter()];
    adapters = adapters.filter(a => fs.existsSync(a.pathPrefix + '/' + TestConfig.FILENAMES.RUN_SCRIPT));
    adapters.unshift(new FastCpeeDiffAdapter());
    return new DiffAlgorithmEvaluation(adapters);
  }

  evalAll(rootDir = TestConfig.DIFF_CASES_DIR) {
    Logger.info('Using ' + rootDir + ' to evaluate diff algorithms', this);

    //collect all directories representing testCases
    const caseDirs = DirectoryScraper.scrape(rootDir);
    for (const testCaseDir of caseDirs) {
      const testCase = DiffTestCase.from(testCaseDir);

      if (testCase == null) {
        Logger.warn('Skipping diff case directory ' + testCaseDir, this);
        continue;
      }

      const results = [];
      Logger.section('DIFF TEST CASE ' + testCase.name, this);
      for (const adapter of this.adapters) {
        Logger.info('Running diff case ' + testCase.name + ' for ' + adapter.displayName + '...', this);
        results.push(adapter.evalCase(testCase));
      }
      const table = [DiffTestResult.header(), testCase.expected.values(), ...results.map(r => r.values())];
      Logger.result('Results for case ' + testCase.name + ':\n' + markdownTable(table), this);
    }
  }
}

