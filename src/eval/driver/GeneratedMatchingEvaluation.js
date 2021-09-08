import {EvalConfig} from '../../config/EvalConfig.js';
import {Logger} from '../../util/Logger.js';
import {GeneratorParameters} from '../gen/GeneratorParameters.js';
import {TreeGenerator} from '../gen/TreeGenerator.js';
import {ChangeParameters} from '../gen/ChangeParameters.js';
import {markdownTable} from 'markdown-table';
import {MatchingEvaluation} from './MatchingEvaluation.js';
import {AbstractEvaluation} from './AbstractEvaluation.js';

/**
 * An evaluation for matching algorithms that uses generated process trees and
 * computes the overlap between the expected and actual matching.
 */
export class GeneratedMatchingEvaluation extends MatchingEvaluation {
  /**
   * Construct a new GeneratedMatchingEvaluation instance.
   * @param {Array<MatchAdapter>} adapters The adapters of the matching
   *     algorithms to be evaluated.
   */
  constructor(adapters = []) {
    super(adapters);
  }

  /**
   * Create a new GeneratedMatchingEvaluation instance with all available
   * matching algorithms.
   * @return {GeneratedMatchingEvaluation}
   */
  static all() {
    return new GeneratedMatchingEvaluation(super.all()._adapters);
  }

  /**
   * @inheritDoc
   * @override
   */
  evalAll() {
    // Simply run all functions...
    this.average(false, false, false);
  }

  /**
   * Evaluate matching algorithms using random process trees of increasing
   * size. The results indicate how well a matching algorithm approximates the
   * 'optimal' matching.
   * @param {Boolean} constChanges If the number of changes should remain
   *     constant.
   * @param {Boolean} constSize If the size of the trees should remain
   *     constant.
   * @param {Boolean} local If a constant number of changes should be applied
   *     locally, i.e. to a small region of the process tree. If set to false,
   *     changes are growing and randomly distributed within the tree.
   */
  average(constChanges, constSize, local = false) {
    Logger.section('Matching evaluation with Generated Trees', this);

    // TODO LATEX REMOVE
    /** @type {Map<String, Array<Object>>} */
    const aggregateResultsPerAdapter = new Map(this._adapters.map((adapter) => [
      adapter.displayName,
      [],
    ]));
    // TODO remove latex
    for (let i = 1; i <= EvalConfig.SIZE_GROWTH.LIMIT; i++) {
      const size = EvalConfig.SIZE_GROWTH.INTERVAL * (constSize ? 1 : i);
      const genParams = new GeneratorParameters(
          size,
          size,
          Math.ceil(Math.log2(size)),
          Math.ceil(Math.log10(size)),
      );
      const treeGen = new TreeGenerator(genParams);
      const changeParams =
          new ChangeParameters(
              EvalConfig.CHANGE_GROWTH.INTERVAL * (constChanges ? 1 : i),
              local,
          );
      const testId = '[Size: ' + size +
          ', Changes: ' + changeParams.totalChanges + ']';
      const results = new Map();
      for (let j = 0; j < EvalConfig.REPS; j++) {
        const oldTree = treeGen.randomTree();
        const [testCase, expectedMatching] =
            treeGen.changeTree(oldTree, changeParams);

        const newTree = testCase.newTree;

        // Run test case for each matching pipeline and compute number of
        // mismatched nodes
        for (const adapter of this._adapters) {
          if (!results.has(adapter)) {
            results.set(adapter, []);
          }
          Logger.info(
              'Running rep ' + j + ' for adapter ' + adapter.displayName,
              this,
          );
          const time = new Date().getTime();
          const actualMatching = adapter.run(oldTree, newTree);
          const elapsedTime = new Date().getTime() - time;
          const matchingCommonality = this.#matchingCommonality(
              expectedMatching,
              actualMatching,
          );
          const mismatches = this.#mismatchedNodes(
              expectedMatching,
              actualMatching,
          );
          results.get(adapter).push([
            adapter.displayName,
            testId,
            elapsedTime,
            matchingCommonality,
            ...mismatches,
          ]);
        }
      }

      const aggregateResults = [];
      for (const [adapter, resultsList] of results) {
        const aggregateResult = [
          adapter.displayName,
          size,
        ];
        for (let j = 2; j < resultsList[0].length; j++) {
          aggregateResult.push(this.avg(resultsList.map((r) => r[j])));
        }
        aggregateResults.push(aggregateResult);
      }

      for (const result of aggregateResults) {
        aggregateResultsPerAdapter.get(result[0]).push(result);
      }
      Logger.result('Results for case ' + testId, this);
      Logger.result(markdownTable([
        [
          'algorithm',
          'size',
          'runtime',
          'compareSet(M, M_prop)',
          'avg mismatched leaves',
          'avg mismatched inners',
          'avg unmatched leaves',
          'avg unmatched inners',
        ],
        ...aggregateResults,
      ]));
    }



    // Produce runtime plots
    Logger.section('RUNTIME LATEX', this);
    AbstractEvaluation.LATEX.fromTemplate(
        [...aggregateResultsPerAdapter.entries()]
            .map((entry) => entry[1].map((result) =>
              '(' + result[1] + ',' + result[3] + ')')));

    Logger.result('\\legend{' + this._adapters.map((a) => a.displayName)
        .join(', ')
        .replaceAll('_', '\\_') + '}');
  }

  /**
   * @param {Array<Number>} arr Any array of numbers.
   * @return {number} The average value.
   */
  avg(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  /**
   * Calculate the commonality between the expected and actual matching as a
   * comparison value.
   * @param {Matching} expected The expected matching.
   * @param {Matching} actual The actual matching.
   * @return {number} The commonality comparison value.
   */
  #matchingCommonality(expected, actual) {
    let common = 0;
    for (const [newNode, oldNode] of expected.newToOldMap) {
      if (actual.isMatched(newNode) && actual.getMatch(newNode) === oldNode) {
        common++;
      }
    }

    return 1 - (common / (Math.max(expected.size(), actual.size())));
  }

  /**
   * Calculate the amount of mismatched and unmatched nodes compared to the
   * expected matching.
   * @param {Matching} expected The expected matching.
   * @param {Matching} actual The actual matching.
   * @return {[Number, Number, Number, Number]} [mismatched Leaves, mismatched
   *     Inners, unmatched Leaves, unmatched Inners]
   */
  #mismatchedNodes(expected, actual) {
    let [
      mismatchedLeaves,
      mismatchedInners,
      unmatchedLeaves,
      unmatchedInners,
    ] = [
      0,
      0,
      0,
      0,
    ];

    for (const [newNode, oldNode] of expected.newToOldMap) {
      if (actual.isMatched(newNode) && actual.getMatch(newNode) !== oldNode) {
        if (newNode.isInnerNode()) {
          mismatchedInners++;
        } else if (newNode.isLeaf()) {
          mismatchedLeaves++;
        }
      }
      if (!actual.isMatched(newNode)) {
        if (newNode.isInnerNode()) {
          unmatchedInners++;
        } else if (newNode.isLeaf()) {
          unmatchedLeaves++;
        }
      }
    }

    for (const [newNode, oldNode] of actual.newToOldMap) {
      if (!expected.isMatched(newNode) && !expected.isMatched(oldNode)) {
        if (newNode.isInnerNode()) {
          mismatchedInners++;
        } else if (newNode.isLeaf()) {
          mismatchedLeaves++;
        }
      }
    }

    return [
      mismatchedLeaves,
      mismatchedInners,
      unmatchedLeaves,
      unmatchedInners,
    ];
  }
}

