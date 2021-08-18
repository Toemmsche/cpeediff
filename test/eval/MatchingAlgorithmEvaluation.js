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
import {AggregateMatchResult} from '../result/AggregateMatchResult.js';
import {Logger} from '../../util/Logger.js';
import {DirectoryScraper} from '../../util/DirectoryScraper.js';
import {MatchTestCase} from '../case/MatchTestCase.js';
import {markdownTable} from 'markdown-table';
import {AbstractEvaluation} from './AbstractEvaluation.js';

export class MatchingAlgorithmEvaluation extends AbstractEvaluation {

  constructor(adapters = []) {
    super(adapters);
  }

  static all() {
    return new MatchingAlgorithmEvaluation(this.matchAdapters());
  }

  evalAll(rootDir = TestConfig.MATCH_CASES_DIR) {
    Logger.info('Using ' + rootDir + ' to evaluate matching algorithms', this);

    const resultsPerAdapter = new Map();
    const resultsPerTest = new Map();
    for (const adapter of this.adapters) {
      resultsPerAdapter.set(adapter, []);
    }

    //collect all directories representing testCases
    const caseDirs = DirectoryScraper.scrape(rootDir);
    for (const testCaseDir of caseDirs) {
      const testCase = MatchTestCase.from(testCaseDir);

      if (testCase == null) {
        //test case is incomplete => skip
        Logger.warn('Skipping match case directory ' + testCaseDir, this);
        continue;
      }

      Logger.section('MATCH TEST CASE ' + testCase.name, this);
      resultsPerTest.set(testCase, []);
      for (const adapter of this.adapters) {
        Logger.info('Running match case ' + testCase.name + ' for ' + adapter.displayName + '...', this);

        const result = adapter.evalCase(testCase);
        resultsPerAdapter.get(adapter).push(result);
        resultsPerTest.get(testCase).push(result);
      }
    }

    const aggregateResults = [];
    for (const [adapter, resultsList] of resultsPerAdapter) {
      aggregateResults.push(AggregateMatchResult.of(resultsList));
    }
    const table = [AggregateMatchResult.header(), ...aggregateResults.map(r => r.values())];
    Logger.result('Results for matching algorithm evaluation' + ':\n' + markdownTable(table), this);
  }

}

