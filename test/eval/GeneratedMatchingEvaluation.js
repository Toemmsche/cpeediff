import {EvalConfig} from '../../src/config/EvalConfig.js';

import {Logger} from '../../util/Logger.js';
import {GeneratorParameters} from '../gen/GeneratorParameters.js';
import {TreeGenerator} from '../gen/TreeGenerator.js';
import {ChangeParameters} from '../gen/ChangeParameters.js';
import {markdownTable} from 'markdown-table';
import {MatchingEvaluation} from './MatchingEvaluation.js';
import {Comparator} from '../../src/match/Comparator.js';

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
    this.single();
    this.average();
  }

  _getMismatchedNodes(expected, actual) {
    let [mismatchedLeaves, mismatchedInners, unmatchedLeaves, unmatchedInners] = [
      0,
      0,
      0,
      0
    ];

    for (const [newNode, oldNode] of expected.newToOldMap) {
      if (actual.isMatched(newNode) && actual.getMatch(newNode) !== oldNode) {
        const actualOldMatch = actual.getMatch(newNode);
        const actualNewMatch = actual.getMatch(oldNode);
        if (newNode.isInnerNode()) {
          //Logger.debug("Mismatched " + newNode.label, this)
          mismatchedInners++;
        } else if (newNode.isLeaf()) {
          //Logger.debug("Mismatched " + newNode.label, this)
          mismatchedLeaves++;
        }
      }
      if (!actual.isMatched(newNode)) {
        if (newNode.isInnerNode()) {
          unmatchedInners++;
        } else if (newNode.isLeaf()) {
          const cv = new Comparator().compare(newNode, oldNode);
          const other = new Comparator().compare(oldNode ,newNode);
          unmatchedLeaves++;
        }
      }
    }

    for(const [newNode, oldNode] of actual.newToOldMap) {
      if(!expected.isMatched(newNode) && !expected.isMatched(oldNode)) {
        if (newNode.isInnerNode()) {
          //Logger.debug("Mismatched " + newNode.label, this)
          mismatchedInners++;
        } else if (newNode.isLeaf()) {
          //Logger.debug("Mismatched " + newNode.label, this)
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

  _matchingCommonality(expected, actual) {
    let common = 0;
    for (const [newNode, oldNode] of expected.newToOldMap) {
      if (actual.isMatched(newNode) && actual.getMatch(newNode) === oldNode) {
        common++;
      }
    }

    return 1 - (common / (Math.max(expected.size(), actual.size())));
  }

  /**
   * Evaluate matching algorithms using random process trees of increasing
   * size. The results indicate how well a matching algorithm approximates the
   * 'optimal' matching.
   * @param {Boolean} flat If the number of changes should remain constant.
   * @param {Boolean} local If the changes should be applied locally, i.e. to a
   *     small region of the process tree. If set to false, changes are
   *     randomly distributed within the tree.
   */
  average(flat = false, local = false) {
    Logger.section('Matching evaluation with Generated Trees', this);

    // TODO LATEX REMOVE
    /** @type {Map<String, Array<Object>>} */
    const aResultsPerAdapter = new Map(this._adapters.map((adapter) => [
      adapter.displayName,
      [],
    ]));
    // TODO remove latex
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
              local
          );
      const testId = '[Size: ' + size +
          ', Changes: ' + changeParams.totalChanges + ']';
      const results = new Map();
      for (let j = 0; j < EvalConfig.PROGRESSION.REPS; j++) {
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
          const matchingCommonality = this._matchingCommonality(
              expectedMatching,
              actualMatching
          );
          const mismatches = this._getMismatchedNodes(
              expectedMatching,
              actualMatching
          );
          results.get(adapter).push([
            adapter.displayName,
            testId,
            elapsedTime,
            matchingCommonality,
            ...mismatches
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
          aggregateResult.push(this.avg(resultsList.map(r => r[j])));
        }
        aggregateResults.push(aggregateResult);
      }

      for (const result of aggregateResults) {
        aResultsPerAdapter.get(result[0]).push(result);
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
        ...aggregateResults
      ]));
    }

    //Produce runtime plots

    const colors = 'black, blue, green, magenta, orange, red, yellow, teal, violet, white'.split(
        ', ');
    let i = 0;
    Logger.section('RUNTIME LATEX', this);
    for (const [adapter, tests] of aResultsPerAdapter) {
      const nextColor = colors[i++];
      Logger.result(('\\addplot[\n' +
          '    color={0},\n' +
          '    mark=square,\n' +
          '    ]\n' +
          '    coordinates {\n' +
          '    {1}\n' +
          '    };').replace('{0}', nextColor).replace(
          '{1}',
          tests.map(t => '(' + t[1] + ',' + t[3] + ')').join('')
      ), this);
    }
    Logger.result('\\legend{' + this._adapters.map(a => a.displayName).join(', ')
        .replaceAll('_', '\\_') + '}');

  }

  avg(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }
}

