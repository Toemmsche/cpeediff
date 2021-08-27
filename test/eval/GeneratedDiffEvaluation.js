import {EvalConfig} from '../EvalConfig.js';
import {Logger} from '../../util/Logger.js';
import {DiffEvaluation} from './DiffEvaluation.js';
import {GeneratorParameters} from '../gen/GeneratorParameters.js';
import {TreeGenerator} from '../gen/TreeGenerator.js';
import {ChangeParameters} from '../gen/ChangeParameters.js';
import {markdownTable} from 'markdown-table';
import {AverageDiffResult} from '../result/AverageDiffResult.js';
import {DiffTestResult} from '../result/DiffTestResult.js';

/**
 * An evaluation of diff algorithms using generated test cases.
 */
export class GeneratedDiffEvaluation extends DiffEvaluation {

  /**
   * Construct a new GeneratedDiffEvaluation instance.
   * @param {Array<DiffAdapter>} adapters The adapters of the algorithms to
   *     use for the evaluation.
   */
  constructor(adapters = []) {
    super(adapters);
  }

  /**
   * Create a new GeneratedDiffEvaluation instance using all algorithms.
   * @return {GeneratedDiffEvaluation}
   */
  static all() {
    return new GeneratedDiffEvaluation(super.all()._adapters);
  }

  /**
   * @inheritDoc
   * @override
   */
  evalAll() {
    Logger.info(
        'Evaluating diff algorithms with generated process trees',
        this,
    );

    // Simply run all functions...
    this.flatSingle();
    this.standardSingle();
    this.standardAggregate();
  }

  /**
   * Evaluate diff algorithms using random process trees of increasing size.The
   * results are relative to a proposed edit script and represent the average
   * of multiple runs with trees of similar size.
   * @param {Boolean} flat If the number of changes should remain constant.
   * @param {Boolean} local If the changes should be applied locally, i.e. to a
   *     small region of the process tree. If set to false, changes are
   *     randomly distributed within the tree.
   */
  average(flat = false, local = false) {
    Logger.section('Diff Evaluation with Generated Trees', this);
    // TODO LATEX REMOVE
    /** @type {Map<String, Array<AverageDiffResult>>} */
    const aResultsPerAdapter = new Map(this._adapters.map((adapter) => [
      adapter.displayName,
      [],
    ]));
    // TODO remove latex
    for (let i = 0; i <= EvalConfig.PROGRESSION.LIMIT; i++) {
      // Init results with empty array for each adapter
      const resultsPerAdapter = new Map(this._adapters.map((adapter) => [
        adapter,
        [],
      ]));
      const size = EvalConfig.PROGRESSION.INITIAL_SIZE *
          (EvalConfig.PROGRESSION.FACTOR ** i);
      const genParams = new GeneratorParameters(
          size,
          size,
          Math.ceil(Math.log2(size)),
          Math.ceil(Math.log10(size)),
      );
      const treeGen = new TreeGenerator(genParams);
      const changeParams =
          new ChangeParameters(
              EvalConfig.PROGRESSION.INITIAL_CHANGES *
              (flat ? 1 : (EvalConfig.PROGRESSION.FACTOR ** i)),
              local,
          );
      const testId = '[Size: ' + size +
          ', Changes: ' + changeParams.totalChanges + ']';

      // Take the average of multiple runs
      for (let j = 0; j < EvalConfig.PROGRESSION.REPS; j++) {
        const oldTree = treeGen.randomTree();
        const testCase = treeGen.changeTree(oldTree, changeParams)[0];

        for (const adapter of this._adapters) {
          Logger.info(
              'Running rep ' + j + ' for adapter ' + adapter.displayName,
              this,
          );
          const result = adapter.evalCase(testCase);
          if (result.isOk()) {
            // Make relative to proposed edit script
            result.actual.cost /= testCase.expected.editScript.cost;
            result.actual.editOperations /= testCase.expected.editScript.size();
          }
          resultsPerAdapter.get(adapter).push(result);
        }
      }
      const aggregateResults = [...resultsPerAdapter.entries()]
          .map((entry) => AverageDiffResult.of(entry[1]))
          .filter((aggregateResult) => aggregateResult != null);
      // TODO remove latex
      for (const aResult of aggregateResults) {
        aResult.size = size;
        aResultsPerAdapter.get(aResult.algorithm).push(aResult);
      }
      // TODO remove latex
      const table = [
        AverageDiffResult.header(),
        ...(aggregateResults.map((result) => result.values())),
      ];
      Logger.result('Results for cases ' + testId);
      Logger.result(markdownTable(table));
    }

    // TODO remove latex
    //Produce runtime plots
    const colors = 'black, red, blue, magenta, orange, violet, teal'.split(
        ', ');
    const markers = 'square*, triangle*, *, diamond*, square, triangle, o, diamond'.split(
        ', ');
    let i = 0;
    Logger.section('RUNTIME LATEX', this);
    for (const [algorithm, tests] of aResultsPerAdapter) {
      Logger.result(('\\addplot[\n' +
          '    color={0},\n' +
          '    mark={2},\n' +
          '    ]\n' +
          '    coordinates {\n' +
          '    {1}\n' +
          '    };')
          .replace('{0}', colors[i])
          .replace('{2}', markers[i++])
          .replace(
              '{1}',
              tests.map(t => '(' + t.size + ',' + t.avgRuntime + ')')
                  .join('')
          ), this);
    }
    Logger.result('\\legend{' + this._adapters.map(a => a.displayName)
        .join(', ')
        .replaceAll('_', '\\_') + '}');

    i = 0;
    Logger.section('COST LATEX', this);
    for (const [adapter, tests] of aResultsPerAdapter) {
      Logger.result(('\\addplot[\n' +
          '    color={0},\n' +
          '    mark={2},\n' +
          '    ]\n' +
          '    coordinates {\n' +
          '    {1}\n' +
          '    };')
          .replace('{0}', colors[i])
          .replace('{2}', markers[i++])
          .replace(
              '{1}',
              tests.map(t => '(' + t.size + ',' + t.avgCost + ')')
                  .join(''),
          ), this);
    }

    i = 0;
    Logger.section('EDIT OPS LATEX', this);
    for (const [adapter, tests] of aResultsPerAdapter) {
      Logger.result(('\\addplot[\n' +
          '    color={0},\n' +
          '    mark={2},\n' +
          '    ]\n' +
          '    coordinates {\n' +
          '    {1}\n' +
          '    };')
          .replace('{0}', colors[i])
          .replace('{2}', markers[i++])
          .replace(
              '{1}',
              tests.map(t => '(' + t.size + ',' + t.avgEditOperations + ')')
                  .join(''),
          ), this);
    }
    // TODO remove latex
  }

  /**
   * Evaluate diff algorithms using random process trees of increasing size.
   * @param {Boolean} flat If the number of changes should remain constant.
   * @param {Boolean} local If the changes should be applied locally, i.e. to a
   *     small region of the process tree. If set to false, changes are
   *     randomly distributed within the tree.
   */
  single(flat = false, local = false) {
    Logger.section('Diff Evaluation with Generated Trees', this);
    for (let i = 0; i <= EvalConfig.PROGRESSION.LIMIT; i++) {
      const size = EvalConfig.PROGRESSION.INITIAL_SIZE *
          (EvalConfig.PROGRESSION.FACTOR ** i);
      const genParams = new GeneratorParameters(
          size,
          size,
          Math.ceil(Math.log2(size)),
          Math.ceil(Math.log10(size)),
      );
      const treeGen = new TreeGenerator(genParams);
      const changeParams =
          new ChangeParameters(
              EvalConfig.PROGRESSION.INITIAL_CHANGES *
              (flat ? 1 : (EvalConfig.PROGRESSION.FACTOR ** i)),
              local,
          );
      const testId = '[Size: ' + size +
          ', Changes: ' + changeParams.totalChanges + ']';

      const oldTree = treeGen.randomTree();
      const testCase = treeGen.changeTree(oldTree, changeParams)[0];

      const results = [];
      for (const adapter of this._adapters) {
        const result = adapter.evalCase(testCase);
        results.push(result);
      }

      const table =
          [
            DiffTestResult.header(),
            testCase.expected.values(),
            ...results.map((result) => result.values()),
          ];

      Logger.result('Results for cases ' + testId);
      Logger.result(markdownTable(table));
    }
  }
}
