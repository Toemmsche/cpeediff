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

import {Logger} from '../../util/Logger.js';
import {DiffAlgorithmEvaluation} from './DiffAlgorithmEvaluation.js';
import {GeneratorParameters} from '../gen/GeneratorParameters.js';
import {TreeGenerator} from '../gen/TreeGenerator.js';
import {ChangeParameters} from '../gen/ChangeParameters.js';
import {DiffTestResult} from '../result/DiffTestResult.js';
import {markdownTable} from 'markdown-table';
import {XyDiffAdapter} from '../diff_adapters/XyDiffAdapter.js';
import {DeltaJsAdapter} from '../../src/temp/DeltaJsAdapter.js';
import {XccAdapter} from '../diff_adapters/XccAdapter.js';
import fs from 'fs';
import {CpeeDiffAdapter} from '../diff_adapters/CpeeDiffAdapter.js';
import {AverageDiffResult} from '../result/AverageDiffResult.js';

export class GeneratedDiffEvaluation extends DiffAlgorithmEvaluation {

  //TODO init with default value
  constructor(adapters = []) {
    super(adapters);
  }

  static all() {
    return new GeneratedDiffEvaluation(this.diffAdapters());
  }

  static fast() {
    let adapters = [new XyDiffAdapter(), new DeltaJsAdapter(), new XccAdapter()];
    adapters = adapters.filter(a => fs.existsSync(a.path + '/' + TestConfig.FILENAMES.RUN_SCRIPT));
    adapters.unshift(new CpeeDiffAdapter());
    return new GeneratedDiffEvaluation(adapters);
  }

  evalAll() {
    Logger.info('Evaluating diff algorithms with generated process trees', this);

    //Simply run all functions...
    this.flatSingle();
    this.standardSingle();
    this.standardAggregate();
  }

  standardSingle() {
    Logger.info('Evaluation of diff algorithms with standard progression', this);
    const resultsPerAdapter = new Map();
    for (let i = 0; i <= TestConfig.PROGRESSION.LIMIT; i++) {
      let size;
      if (TestConfig.PROGRESSION.EXPONENTIAL) {
        size = TestConfig.PROGRESSION.INITIAL_SIZE * (TestConfig.PROGRESSION.FACTOR ** i);
      } else {
        size = TestConfig.PROGRESSION.INITIAL_SIZE += i * TestConfig.PROGRESSION.INTERVAL;
      }
      //choose sensible generator and change parameters
      const genParams = new GeneratorParameters(size, size, Math.ceil(Math.log2(size)), Math.ceil(Math.log10(size)));
      const changeParams = new ChangeParameters(TestConfig.PROGRESSION.INITIAL_CHANGES * (TestConfig.PROGRESSION.FACTOR ** i));

      const treeGen = new TreeGenerator(genParams);

      const oldTree = treeGen.randomTree();

      const testCase = treeGen.changeTree(oldTree, changeParams).testCase;

      //Run test case for each diff algorithm
      const results = [];
      for (const adapter of this.adapters) {
        Logger.info('Running case ' + testCase.name + ' for adapter ' + adapter.displayName, this);
        const result = adapter.evalCase(testCase);
        results.push(result);

        //make relative
        if (result.isOk()) {
          result.actual.cost /= testCase.expected.editScript.cost;
          result.actual.editOperations /= testCase.expected.editScript.size();

          if (!resultsPerAdapter.has(adapter)) {
            resultsPerAdapter.set(adapter, []);
          }
          resultsPerAdapter.get(adapter).push({
            size: Math.max(testCase.oldTree.size(), testCase.newTree.size()),
            result: result
          });
        }
      }

      //Add expected values to table
      const table = [DiffTestResult.header(), testCase.expected.values(), ...results.map(r => r.values())];
      Logger.result('Results for case ' + testCase.name);
      Logger.result(markdownTable(table));
    }

    //Produce runtime plots

    const colors = 'black, blue, green, magenta, orange, red, yellow, teal, violet, white'.split(', ');
    let i = 0;
    Logger.section('RUNTIME LATEX', this);
    for (const [adapter, tests] of resultsPerAdapter) {
      const nextColor = colors[i++];
      Logger.result(('\\addplot[\n' +
          '    color={0},\n' +
          '    mark=square,\n' +
          '    ]\n' +
          '    coordinates {\n' +
          '    {1}\n' +
          '    };').replace('{0}', nextColor).replace('{1}', tests.map(t => '(' + t.size + ',' + t.result.runtime + ')').join('')), this);
    }
    Logger.result('\\legend{' + this.adapters.map(a => a.displayName).join(', ').replaceAll('_', '\\_') + '}');

    i = 0;
    Logger.section('COST LATEX', this);
    for (const [adapter, tests] of resultsPerAdapter) {
      const nextColor = colors[i++];
      Logger.result(('\\addplot[\n' +
          '    color={0},\n' +
          '    mark=square,\n' +
          '    ]\n' +
          '    coordinates {\n' +
          '    {1}\n' +
          '    };').replace('{0}', nextColor).replace('{1}', tests.map(t => '(' + t.size + ',' + t.result.actual.cost + ')').join('')), this);
    }
    Logger.result('\\legend{' + this.adapters.map(a => a.displayName).join(', ').replaceAll('_', '\\_') + '}');

    i = 0;
    Logger.section('EDIT OPS LATEX', this);
    for (const [adapter, tests] of resultsPerAdapter) {
      const nextColor = colors[i++];
      Logger.result(('\\addplot[\n' +
          '    color={0},\n' +
          '    mark=square,\n' +
          '    ]\n' +
          '    coordinates {\n' +
          '    {1}\n' +
          '    };').replace('{0}', nextColor).replace('{1}', tests.map(t => '(' + t.size + ',' + t.result.actual.editOperations + ')').join('')), this);
    }
    Logger.result('\\legend{' + this.adapters.map(a => a.displayName).join(', ').replaceAll('_', '\\_') + '}');

  }

  flatLocal() {
    Logger.info('Evaluation of diff algorithms with no change progression and local changes', this);

    const resultsPerAdapter = new Map();
    for (let i = 0; i <= TestConfig.PROGRESSION.LIMIT; i++) {
      let size;
      if (TestConfig.PROGRESSION.EXPONENTIAL) {
        size = TestConfig.PROGRESSION.INITIAL_SIZE * (TestConfig.PROGRESSION.FACTOR ** i);
      } else {
        size = TestConfig.PROGRESSION.INITIAL_SIZE += i * TestConfig.PROGRESSION.INTERVAL;
      }
      //choose sensible generator and change parameters
      const genParams = new GeneratorParameters(size, size, Math.ceil(Math.log2(size)), Math.ceil(Math.log10(size)));
      const changeParams = new ChangeParameters(TestConfig.PROGRESSION.INITIAL_CHANGES, true, 4, 2, 3, 1);

      const treeGen = new TreeGenerator(genParams);

      const oldTree = treeGen.randomTree();

      const testCase = treeGen.changeTree(oldTree, changeParams).testCase;

      //Run test case for each diff algorithm
      const results = [];
      for (const adapter of this.adapters) {
        Logger.info('Running case ' + testCase.name + ' for adapter ' + adapter.displayName, this);
        const result = adapter.evalCase(testCase);
        results.push(result);

        //make relative
        if (result.isOk()) {
          result.actual.cost /= testCase.expected.editScript.cost;
          result.actual.editOperations /= testCase.expected.editScript.size();

          if (!resultsPerAdapter.has(adapter)) {
            resultsPerAdapter.set(adapter, []);
          }
          resultsPerAdapter.get(adapter).push({
            size: Math.max(testCase.oldTree.size(), testCase.newTree.size()),
            result: result
          });
        }
      }

      //Add expected values to table
      const table = [DiffTestResult.header(), testCase.expected.values(), ...results.map(r => r.values())];
      Logger.result('Results for case ' + testCase.name);
      Logger.result(markdownTable(table));
    }

    //Produce runtime plots

    const colors = 'black, blue, green, magenta, orange, red, yellow, teal, violet, white'.split(', ');
    let i = 0;
    Logger.section('RUNTIME LATEX', this);
    for (const [adapter, tests] of resultsPerAdapter) {
      const nextColor = colors[i++];
      Logger.result(('\\addplot[\n' +
          '    color={0},\n' +
          '    mark=square,\n' +
          '    ]\n' +
          '    coordinates {\n' +
          '    {1}\n' +
          '    };').replace('{0}', nextColor).replace('{1}', tests.map(t => '(' + t.size + ',' + t.result.runtime + ')').join('')), this);
    }
    Logger.result('\\legend{' + this.adapters.map(a => a.displayName).join(', ').replaceAll('_', '\\_') + '}');

    i = 0;
    Logger.section('COST LATEX', this);
    for (const [adapter, tests] of resultsPerAdapter) {
      const nextColor = colors[i++];
      Logger.result(('\\addplot[\n' +
          '    color={0},\n' +
          '    mark=square,\n' +
          '    ]\n' +
          '    coordinates {\n' +
          '    {1}\n' +
          '    };').replace('{0}', nextColor).replace('{1}', tests.map(t => '(' + t.size + ',' + t.result.actual.cost + ')').join('')), this);
    }
    Logger.result('\\legend{' + this.adapters.map(a => a.displayName).join(', ').replaceAll('_', '\\_') + '}');

    i = 0;
    Logger.section('EDIT OPS LATEX', this);
    for (const [adapter, tests] of resultsPerAdapter) {
      const nextColor = colors[i++];
      Logger.result(('\\addplot[\n' +
          '    color={0},\n' +
          '    mark=square,\n' +
          '    ]\n' +
          '    coordinates {\n' +
          '    {1}\n' +
          '    };').replace('{0}', nextColor).replace('{1}', tests.map(t => '(' + t.size + ',' + t.result.actual.editOperations + ')').join('')), this);
    }
    Logger.result('\\legend{' + this.adapters.map(a => a.displayName).join(', ').replaceAll('_', '\\_') + '}');

  }

  flatSingle() {
    Logger.info('Evaluation of diff algorithms with no change progression', this);

    const resultsPerAdapter = new Map();
    for (let i = 0; i <= TestConfig.PROGRESSION.LIMIT; i++) {
      let size;
      if (TestConfig.PROGRESSION.EXPONENTIAL) {
        size = TestConfig.PROGRESSION.INITIAL_SIZE * (TestConfig.PROGRESSION.FACTOR ** i);
      } else {
        size = TestConfig.PROGRESSION.INITIAL_SIZE += i * TestConfig.PROGRESSION.INTERVAL;
      }
      //choose sensible generator and change parameters
      const genParams = new GeneratorParameters(size, size, Math.ceil(Math.log2(size)), Math.ceil(Math.log10(size)));
      const changeParams = new ChangeParameters(TestConfig.PROGRESSION.INITIAL_CHANGES);

      const treeGen = new TreeGenerator(genParams);

      const oldTree = treeGen.randomTree();

      const testCase = treeGen.changeTree(oldTree, changeParams).testCase;

      //Run test case for each diff algorithm
      const results = [];
      for (const adapter of this.adapters) {
        Logger.info('Running case ' + testCase.name + ' for adapter ' + adapter.displayName, this);
        const result = adapter.evalCase(testCase);
        results.push(result);

        //make relative
        if (result.isOk()) {
          result.actual.cost /= testCase.expected.editScript.cost;
          result.actual.editOperations /= testCase.expected.editScript.size();

          if (!resultsPerAdapter.has(adapter)) {
            resultsPerAdapter.set(adapter, []);
          }
          resultsPerAdapter.get(adapter).push({
            size: Math.max(testCase.oldTree.size(), testCase.newTree.size()),
            result: result
          });
        }
      }

      //Add expected values to table
      const table = [DiffTestResult.header(), testCase.expected.values(), ...results.map(r => r.values())];
      Logger.result('Results for case ' + testCase.name);
      Logger.result(markdownTable(table));
    }

    //Produce runtime plots

    const colors = 'black, blue, green, magenta, orange, red, yellow, teal, violet, white'.split(', ');
    let i = 0;
    Logger.section('RUNTIME LATEX', this);
    for (const [adapter, tests] of resultsPerAdapter) {
      const nextColor = colors[i++];
      Logger.result(('\\addplot[\n' +
          '    color={0},\n' +
          '    mark=square,\n' +
          '    ]\n' +
          '    coordinates {\n' +
          '    {1}\n' +
          '    };').replace('{0}', nextColor).replace('{1}', tests.map(t => '(' + t.size + ',' + t.result.runtime + ')').join('')), this);
    }
    Logger.result('\\legend{' + this.adapters.map(a => a.displayName).join(', ').replaceAll('_', '\\_') + '}');

    i = 0;
    Logger.section('COST LATEX', this);
    for (const [adapter, tests] of resultsPerAdapter) {
      const nextColor = colors[i++];
      Logger.result(('\\addplot[\n' +
          '    color={0},\n' +
          '    mark=square,\n' +
          '    ]\n' +
          '    coordinates {\n' +
          '    {1}\n' +
          '    };').replace('{0}', nextColor).replace('{1}', tests.map(t => '(' + t.size + ',' + t.result.actual.cost + ')').join('')), this);
    }
    Logger.result('\\legend{' + this.adapters.map(a => a.displayName).join(', ').replaceAll('_', '\\_') + '}');

    i = 0;
    Logger.section('EDIT OPS LATEX', this);
    for (const [adapter, tests] of resultsPerAdapter) {
      const nextColor = colors[i++];
      Logger.result(('\\addplot[\n' +
          '    color={0},\n' +
          '    mark=square,\n' +
          '    ]\n' +
          '    coordinates {\n' +
          '    {1}\n' +
          '    };').replace('{0}', nextColor).replace('{1}', tests.map(t => '(' + t.size + ',' + t.result.actual.editOperations + ')').join('')), this);
    }
    Logger.result('\\legend{' + this.adapters.map(a => a.displayName).join(', ').replaceAll('_', '\\_') + '}');
  }

  standardAggregate() {
    Logger.info('Aggregate evaluation of diff algorithms with standard progression', this);
    for (let i = 0; i <= TestConfig.PROGRESSION.LIMIT; i++) {
      const size = TestConfig.PROGRESSION.INITIAL_SIZE * (TestConfig.PROGRESSION.FACTOR ** i);
      const resultsPerAdapter = new Map(this.adapters.map((a) => [a, []]));

      const genParams = new GeneratorParameters(size, size, Math.ceil(Math.log2(size)), Math.ceil(Math.log10(size)));
      const changeParams = new ChangeParameters(TestConfig.PROGRESSION.INITIAL_CHANGES *(TestConfig.PROGRESSION.FACTOR ** i));

      const testId = [size, changeParams.totalChanges].join('_');

      const treeGen = new TreeGenerator(genParams);
      for (let j = 0; j < TestConfig.PROGRESSION.REPS; j++) {
        const oldTree = treeGen.randomTree();

        const testCase = treeGen.changeTree(oldTree, changeParams).testCase;

        for (const adapter of this.adapters) {
          Logger.info('Running rep ' + j + ' for adapter ' + adapter.displayName, this);
          const result = adapter.evalCase(testCase);
          if (result.isOk()) {
            result.actual.cost /= testCase.expected.editScript.cost;
            result.actual.editOperations /= testCase.expected.editScript.size();
          }
          resultsPerAdapter.get(adapter).push(result);
        }
      }
      const aggregateResults = [...resultsPerAdapter.entries()].map(e => AverageDiffResult.of(e[1]));
      const table = [AverageDiffResult.header(), ...(aggregateResults.map(r => r.values()))];
      Logger.result('Results for cases ' + testId);
      Logger.result(markdownTable(table));
    }
  }

  flatAggregate() {
    Logger.info('Aggregate evaluation of diff algorithms no change progression', this);
    for (let i = 0; i <= TestConfig.PROGRESSION.LIMIT; i++) {
      const size = TestConfig.PROGRESSION.INITIAL_SIZE * (TestConfig.PROGRESSION.FACTOR ** i);
      const resultsPerAdapter = new Map(this.adapters.map((a) => [a, []]));

      const genParams = new GeneratorParameters(size, size, Math.ceil(Math.log2(size)), Math.ceil(Math.log10(size)));
      const changeParams = new ChangeParameters(TestConfig.PROGRESSION.INITIAL_CHANGES);

      const testId = [size, changeParams.totalChanges].join('_');

      const treeGen = new TreeGenerator(genParams);
      for (let j = 0; j < TestConfig.PROGRESSION.REPS; j++) {
        const oldTree = treeGen.randomTree();
        const testCase = treeGen.changeTree(oldTree, changeParams).testCase;

        for (const adapter of this.adapters) {
          Logger.info('Running rep ' + j + ' for adapter ' + adapter.displayName, this);
          const result = adapter.evalCase(testCase);
          if (result.isOk()) {
            result.actual.cost /= testCase.expected.editScript.cost;
            result.actual.editOperations /= testCase.expected.editScript.size();
          }
          resultsPerAdapter.get(adapter).push(result);
        }
      }
      const aggregateResults = [...resultsPerAdapter.entries()].map(e => AverageDiffResult.of(e[1]));
      const table = [AverageDiffResult.header(), ...(aggregateResults.map(r => r.values()))];
      Logger.result('Results for cases ' + testId);
      Logger.result(markdownTable(table));
    }

  }
}

