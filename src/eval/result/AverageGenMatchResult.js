/**
 * The average of many gen match results.
 *
 * @see {GenMatchTestResult}
 */
export class AverageGenMatchResult {
  /**
   * The matching algorithm that produced the match results.
   * @type {String}
   * @const
   */
  algorithm;
  /**
   * The name of the match test case configuration that was run multiple times.
   * @type {String}
   * @const
   */
  caseName;
  /**
   * The time (in ms) it took to produced the result. Null indicates failure.
   * @type {?Number}
   * @const
   */
  avgRuntime;
  /**
   * The avgCommonality between the expected and actual matching as a comparison
   * value.
   * @type {Number}
   * @const
   */
  avgCommonality;
  /**
   * The number of mismatched leaves.
   * @type {Number}
   * @const
   */
  avgMismatchedLeaves;
  /**
   * The number of mismatched inner nodes.
   * @type {Number}
   * @const
   */
  avgMismatchedInners;
  /**
   * The number of leaves that are matched in the expected, but not the actual,
   * matching.
   * @type {Number}
   * @const
   */
  avgUnmatchedLeaves;
  /**
   * The number of inner nodes that are matched in the expected, but not the
   * actual, matching.
   * @type {Number}
   * @const
   */
  avgUnmatchedInners;

  /**
   * Construct a new GenMatchTestResult instance.
   * @param {String} caseName The name of the corresponding diff test case.
   * @param {String} algorithm The name of the algorithm that produced the
   *     matching.
   * @param {Number} avgRuntime The average time (in ms) it took to produced
   *     the
   *     result. Null indicates failure.
   * @param {Number} avgCommonality The average avgCommonality between the
   *     expected and actual matching as a comparison value.
   * @param {Number} avgMismatchedLeaves The average number of mismatched
   *     leaves.
   * @param {Number} avgMismatchedInners The average number of mismatched inner
   *     nodes.
   * @param {Number} avgUnmatchedLeaves The average number of leaves that are
   *     matched in the expected, but not the actual, matching.
   * @param {Number} avgUnmatchedInners The average number of inner nodes that
   *     are matched in the expected, but not the actual, matching.
   */
  constructor(
      caseName,
      algorithm,
      avgRuntime,
      avgCommonality,
      avgMismatchedLeaves,
      avgMismatchedInners,
      avgUnmatchedLeaves,
      avgUnmatchedInners,
  ) {
    this.caseName = caseName;
    this.algorithm = algorithm;
    this.avgRuntime = avgRuntime;
    this.avgMismatchedInners = avgMismatchedInners;
    this.avgMismatchedLeaves = avgMismatchedLeaves;
    this.avgCommonality = avgCommonality;
    this.avgUnmatchedLeaves = avgUnmatchedLeaves;
    this.avgUnmatchedInners = avgUnmatchedInners;
  }

  /**
   * @return {Array<String>} The header row for a list of average gen match test
   *     results to use in tables.
   */
  static header() {
    return [
      'Algorithm',
      'Avg Runtime',
      'Avg Commonality',
      'Avg Mismatched Leaves',
      'Avg Mismatched Inners',
      'Avg Unmatched Leaves',
      'Avg Unmatched Inners',
    ];
  }

  /**
   * Construct an AverageGenMatchResult instance from a list of gen match test
   * results pertaining to the same test case configuration. Results that
   * indicate a timeout or runtime error are ignored during the metric
   * calculation.
   * @param {Array<GenMatchTestResult>} genMatchResults The list of gen match
   *     test results.
   * @return {?AverageGenMatchResult} Derived metrics for the results. Null if
   *     no valid results were found.
   */
  static of(genMatchResults) {
    // Only consider test case executions that didnt result in an error or
    // timeout
    genMatchResults = genMatchResults.filter((r) => r.isOk());
    if (genMatchResults.length === 0) {
      // Cannot produce averages
      return null;
    }
    const caseName = genMatchResults[0].caseName;
    const algorithm = genMatchResults[0].algorithm;

    const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;

    return new AverageGenMatchResult(
        caseName,
        algorithm,
        avg(genMatchResults.map((result) => result.runtime)),
        avg(genMatchResults.map((result) => result.commonality)),
        avg(genMatchResults.map((result) => result.mismatchedLeaves)),
        avg(genMatchResults.map((result) => result.mismatchedInners)),
        avg(genMatchResults.map((result) => result.unmatchedLeaves)),
        avg(genMatchResults.map((result) => result.unmatchedInners)),
    );
  }

  /**
   * @return {Array<String>} The row of values of this result for use in tables.
   */
  values() {
    // A non-OK verdict indicates failure, fill the  array with it
    return [
      this.algorithm,
      this.avgRuntime,
      this.avgCommonality,
      this.avgMismatchedLeaves,
      this.avgUnmatchedInners,
      this.avgUnmatchedLeaves,
      this.avgUnmatchedInners,
    ];
  }
}

