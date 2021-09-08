import {AbstractTestResult} from './AbstractTestResult.js';
import {ActualDiff} from '../actual/ActualDiff.js';

/**
 * The result for a diff test case.
 */
export class DiffTestResult extends AbstractTestResult {

  /**
   * The time (in ms) it took to produced the result. Null indicates failure.
   * @type {?Number}
   * @const
   */
  runtime;

  /**
   * Construct a new DiffTestResult instance.
   @param {String} caseName The name of the corresponding diff test case.
   * @param {String} algorithm The name of the algorithm that produced the
   *     diff.
   * @param {Number} runtime The time (in ms) it took to produced the result.
   *     Null indicates failure.
   * @param {?ActualDiff} actual The actual diff produced by the
   *     algorithm. Null indicates failure.
   * @param {String} verdict The verdict for this diff result.
   */
  constructor(
      caseName,
      algorithm,
      runtime,
      actual,
      verdict,
  ) {
    super(
        caseName,
        algorithm,
        actual,
        verdict,
    );
    this.runtime = runtime;
  }

  /**
   * @return {Array<String>} The header row for a list of diff test results to
   *     use in tables.
   */
  static header() {
    return [
      'Algorithm',
      'Runtime',
      'Edit Script Cost',
      'Edit Script Size',
      'Insertions',
      'Moves',
      'Updates',
      'Deletions',
      'Diff Size',
    ];
  }

  /**
   * @return {Array<String>} The row of values of this result for use in tables.
   */
  values() {
    // A non-OK verdict indicates failure, fill the  array with it
    if (!this.isOk()) {
      return [
        this.algorithm,
        ...(new Array(DiffTestResult.header().length - 1)
            .fill(this.verdict)),
      ];
    }
    return [
      this.algorithm,
      this.runtime,
      this.actual.cost,
      this.actual.editOperations,
      this.actual.insertions,
      this.actual.moves,
      this.actual.updates,
      this.actual.deletions,
      this.actual.diffSize,
    ];
  }
}

