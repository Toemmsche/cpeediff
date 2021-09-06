import {EvalConfig} from '../../src/config/EvalConfig.js';
import {Logger} from '../../util/Logger.js';
import {DiffEvaluation} from './DiffEvaluation.js';
import {GeneratorParameters} from '../gen/GeneratorParameters.js';
import {TreeGenerator} from '../gen/TreeGenerator.js';
import {ChangeParameters} from '../gen/ChangeParameters.js';
import {markdownTable} from 'markdown-table';
import {AverageDiffResult} from '../result/AverageDiffResult.js';
import {DiffTestResult} from '../result/DiffTestResult.js';
import {AbstractEvaluation} from './AbstractEvaluation.js';

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
    // Simply run all functions...
    this.single();
    this.average();
  }

  /**
   * Evaluate diff algorithms using random process trees of increasing size.
   * The results are relative to a proposed edit script and represent the
   * average of multiple runs with trees of similar size.
   * @param {Boolean} local If a constant number of changes should be applied
   *     locally, i.e. to a small region of the process tree. If set to false,
   *     changes are growing and randomly distributed within the tree.
   */
  growingSize(local = false) {
    Logger.section('Diff Evaluation with Generated Trees', this);
    // TODO LATEX REMOVE
    /** @type {Map<String, Array<AverageDiffResult>>} */
    const aResultsPerAdapter = new Map(this._adapters.map((adapter) => [
      adapter.displayName,
      [],
    ]));
    // TODO remove latex
    for (let i = 1; i <= EvalConfig.SIZE_GROWTH.LIMIT; i++) {
      // Init results with empty array for each adapter
      const resultsPerAdapter = new Map(this._adapters.map((adapter) => [
        adapter,
        [],
      ]));
      const size = EvalConfig.SIZE_GROWTH.INTERVAL * i;
      const genParams = new GeneratorParameters(
          size,
          size,
          Math.ceil(Math.log2(size)),
          Math.ceil(Math.log10(size)),
      );
      const treeGen = new TreeGenerator(genParams);
      const changeParams =
          new ChangeParameters(
              EvalConfig.CHANGE_GROWTH.INTERVAL * i,
              local,
          );
      const testId = '[Size: ' + size +
          ', Changes: ' + changeParams.totalChanges + ']';

      // Take the average of multiple runs
      for (let j = 0; j < EvalConfig.REPS; j++) {
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
          } else if (result.isTimeOut()) {
            // Do not use in future runs
            const adapterIndex = this._adapters.indexOf(adapter);
            this._adapters.splice(adapterIndex, 1);
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

    this.publishLatex(aResultsPerAdapter, (result) => result.size);
  }

  /**
   * Evaluate diff algorithms using a random process tree of constant size, to
   * which an increasing number of random changes are applied randomly
   * throughout the tree. The results are relative to a proposed edit script
   * and represent the average of multiple runs.
   */
  constantSize() {
    Logger.section(
        'Diff Evaluation with Generated Trees of Constant Size',
        this,
    );
    /** @type {Map<String, Array<AverageDiffResult>>} */
    const averageResultsPerAdapter = new Map(this._adapters.map((adapter) => [
      adapter.displayName,
      [],
    ]));

    // Use the same tree and generator for all runs
    const size = EvalConfig.CHANGE_GROWTH.SIZE;
    const genParams = new GeneratorParameters(
        size,
        size,
        Math.ceil(Math.log2(size)),
        Math.ceil(Math.log10(size)),
    );
    const treeGen = new TreeGenerator(genParams);
    const oldTree = treeGen.randomTree();

    for (let i = 1; i <= EvalConfig.CHANGE_GROWTH.LIMIT; i++) {
      // Init results with empty array for each adapter
      const resultsPerAdapter = new Map(this._adapters.map((adapter) => [
        adapter,
        [],
      ]));

      const numChanges = i * EvalConfig.CHANGE_GROWTH.INTERVAL;
      // Cannot be local
      const changeParams = new ChangeParameters(numChanges, false);
      const testId = '[Size: ' + size +
          ', Changes: ' + changeParams.totalChanges + ']';

      // Take the average of multiple runs
      for (let j = 0; j < EvalConfig.REPS; j++) {
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
          } else if (result.isTimeOut()) {
            // Do not use in future runs
            const adapterIndex = this._adapters.indexOf(adapter);
            this._adapters.splice(adapterIndex, 1);
          }
          resultsPerAdapter.get(adapter).push(result);
        }
      }
      const averageResults = [...resultsPerAdapter.entries()]
          .map((entry) => AverageDiffResult.of(entry[1]))
          .filter((averageResult) => averageResult != null);
      // TODO remove latex
      for (const averageResult of averageResults) {
        // Preserve size as object property
        averageResult.numChanges = numChanges;
        averageResultsPerAdapter.get(averageResult.algorithm)
            .push(averageResult);
      }
      // TODO remove latex
      const table = [
        AverageDiffResult.header(),
        ...(averageResults.map((result) => result.values())),
      ];
      Logger.result('Results for cases ' + testId);
      Logger.result(markdownTable(table));
    }

    // TODO remove latex
    // Produce runtime plots
    this.publishLatex(averageResultsPerAdapter);
  }

  publishLatex(averageResultsPerAdapter, xFunc) {
    Logger.section('RUNTIME LATEX', this);
    Logger.result(AbstractEvaluation.LATEX.fromTemplate(
        [...averageResultsPerAdapter.entries()]
            .map((entry) => entry[1]
                .map((t) => '(' + xFunc(t) + ',' + t.avgRuntime + ')'),
            ),
    ));
    Logger.result('\\legend{' + this._adapters.map((a) => a.displayName)
        .join(', ')
        .replaceAll('_', '\\_') + '}');
    Logger.section('COST LATEX', this);
    Logger.result(AbstractEvaluation.LATEX.fromTemplate(
        [...averageResultsPerAdapter.entries()]
            .map((entry) => entry[1]
                .map((t) => '(' + xFunc(t) + ',' + t.avgCost + ')'),
            ),
    ));
    Logger.section('EDIT OPS LATEX', this);
    Logger.result(AbstractEvaluation.LATEX.fromTemplate(
        [...averageResultsPerAdapter.entries()]
            .map((entry) => entry[1]
                .map((t) => '(' + xFunc(t) + ',' + t.avgEditOperations + ')'),
            ),
    ));
  }

  /**
   * Evaluate diff algorithms using random process trees of increasing size.
   * @param {Boolean} local If the changes should be applied locally, i.e. to a
   *     small region of the process tree. If set to false, changes are growing
   *     and randomly distributed within the tree.
   */
  single( local = false) {
    Logger.section('Diff Evaluation with Generated Trees', this);
    for (let i = 0; i <= EvalConfig.SIZE_GROWTH.LIMIT; i++) {
      const size = EvalConfig.SIZE_GROWTH.INITIAL_SIZE *
          (EvalConfig.SIZE_GROWTH.FACTOR ** i);
      const genParams = new GeneratorParameters(
          size,
          size,
          Math.ceil(Math.log2(size)),
          Math.ceil(Math.log10(size)),
      );
      const treeGen = new TreeGenerator(genParams);
      const changeParams =
          new ChangeParameters(
              EvalConfig.SIZE_GROWTH.INITIAL_CHANGES *
              (local ? 1 : (EvalConfig.SIZE_GROWTH.FACTOR ** i)),
              local,
          );

      const oldTree = treeGen.randomTree();
      const testCase = treeGen.changeTree(oldTree, changeParams)[0];

      const results = [];
      for (const adapter of this._adapters) {
        Logger.info(
            'Running case ' + testCase.name +
            ' for adapter ' + adapter.displayName,
            this,
        );
        const result = adapter.evalCase(testCase);
        results.push(result);
      }

      const table =
          [
            DiffTestResult.header(),
            testCase.expected.values(),
            ...results.map((result) => result.values()),
          ];

      Logger.result('Results for case ' + testCase.name);
      Logger.result(markdownTable(table));
    }
  }
}
