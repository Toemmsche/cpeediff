/**
 * The average result of multiple diff test results for the same test
 * configuration.
 *
 * @see {DiffTestResult}
 */
export class AverageDiffResult {
  /**
   * The diff algorithm that produced the diff results.
   * @type {String}
   * @const
   */
  algorithm;
  /**
   * The name of the diff test case configuration that was run multiple times.
   * @type {String}
   * @const
   */
  caseName;

  /**
   * The average runtime across the results.
   * @type {Number}
   * @const
   */
  avgRuntime;
  /**
   * The maximum runtime observed across all results.
   * @type {Number}
   * @const
   */
  maxRuntime;
  /**
   * The standard deviation of the runtime.
   * @type {Number}
   * @const
   */
  stdDevRuntime;

  /**
   * The average edits script cost across the results.
   * @type {Number}
   * @const
   */
  avgCost;
  /**
   * The maximum edit script cost observed across all results.
   * @type {Number}
   * @const
   */
  maxCost;
  /**
   * The standard deviation of the edit script cost.
   * @type {Number}
   * @const
   */
  stdDevCost;

  /**
   * The average number of edit operations across the results.
   * @type {Number}
   * @const
   */
  avgEditOperations;
  /**
   * The maximum number of edit operations observed across all results.
   * @type {Number}
   * @const
   */
  maxEditOperations;
  /**
   * The standard deviation of the number of edit operations.
   * @type {Number}
   * @const
   */
  stdDevEditOperations;

  /**
   * Construct a new AverageDiffResult instance.
   * @param {String} caseName The name of the diff test case configuration that
   *     was run multiple times.
   * @param {String} algorithm The matching algorithm that produced the match
   *     results.
   * @param {Number} avgRuntime The average runtime across the results.
   * @param {Number} maxRuntime The maximum runtime observed across all
   *     results.
   * @param {Number} stdDevRuntime The standard deviation of the runtime.
   * @param {Number} avgCost The average edits script cost across the results.
   * @param {Number} maxCost The maximum edit script cost observed across all
   *     results.
   * @param {Number} stdDevCost The standard deviation of the edit script cost.
   * @param {Number} avgEditOperations The average number of edit operations
   *     across the results.
   * @param {Number} maxEditOperations The maximum number of edit operations
   *     observed across all results.
   * @param {Number} stdDevEditOperations The standard deviation of the number
   *     of edit operations.
   */
  constructor(
      caseName,
      algorithm,
      avgRuntime,
      maxRuntime,
      stdDevRuntime,
      avgCost,
      maxCost,
      stdDevCost,
      avgEditOperations,
      maxEditOperations,
      stdDevEditOperations,
  ) {
    this.algorithm = algorithm;
    this.caseName = caseName;
    this.avgRuntime = avgRuntime;
    this.maxRuntime = maxRuntime;
    this.stdDevRuntime = stdDevRuntime;
    this.avgCost = avgCost;
    this.maxCost = maxCost;
    this.stdDevCost = stdDevCost;
    this.avgEditOperations = avgEditOperations;
    this.maxEditOperations = maxEditOperations;
    this.stdDevEditOperations = stdDevEditOperations;
  }

  /**
   * @return {Array<String>} The header row for a list of average diff results
   *     results to use in tables.
   */
  static header() {
    return [
      'algorithm',
      'avg runtime',
      'max runtime',
      'runtime std dev',
      'avg rel cost',
      'max rel cost',
      'rel cost std dev',
      'avg rel edit operations',
      'max rel edit operations',
      'rel edit operations std dev',
    ];
  }

  /**
   * Construct a AverageDiffResult instance from a list of diff test results
   * pertaining to the same test case configuration. Results that indicate a
   * timeout or runtime error are ignored during the metric calculation.
   * @param {Array<DiffTestResult>} diffResults The list of diff test results.
   * @return {?AverageDiffResult} Derived metrics for the results. Null if no
   *     valid results were found.
   */
  static of(diffResults) {
    // Only consider test case executions that didnt result in an error or
    // timeout
    diffResults = diffResults.filter((r) => r.isOk());

    if (diffResults.length === 0) {
      // Cannot produce averages
      return null;
    }

    const algorithm = diffResults[0].algorithm;
    const caseName = diffResults[0].caseName;

    const runtimes = diffResults.map((result) => result.runtime);
    const costs = diffResults.map((result) => result.actual.cost);
    const editOperations = diffResults.map((result) =>
        result.actual.editOperations);

    const [avgRuntime, maxRuntime] = [
      runtimes.reduce((a, b) => a + b, 0) / runtimes.length,
      Math.max(...runtimes),
    ];
    const [avgCost, maxCost] = [
      costs.reduce((a, b) => a + b, 0) / costs.length,
      Math.max(...costs),
    ];
    const [avgEditOperations, maxEditOperations] = [
      editOperations.reduce((a, b) => a + b, 0) / editOperations.length,
      Math.max(...editOperations),
    ];

    const stdDevRuntime = Math.sqrt(runtimes
        .map((runtime) => ((runtime - avgRuntime) ** 2))
        .reduce((a, b) => a + b, 0) / runtimes.length);
    const stdDevCost = Math.sqrt(costs
        .map((cost) => ((cost - avgCost) ** 2))
        .reduce((a, b) => a + b, 0) / costs.length);
    const stdDevEditOperations = Math.sqrt(editOperations
        .map((editOps) => ((editOps - avgEditOperations) ** 2))
        .reduce((a, b) => a + b, 0) / editOperations.length);

    return new AverageDiffResult(
        caseName,
        algorithm,
        avgRuntime,
        maxRuntime,
        stdDevRuntime,
        avgCost,
        maxCost,
        stdDevCost,
        avgEditOperations,
        maxEditOperations,
        stdDevEditOperations,
    );
  }

  /**
   * @return {Array<String>} The row of values of this result for use in tables.
   */
  values() {
    return [
      this.algorithm,
      ...[
        this.avgRuntime,
        this.maxRuntime,
        this.stdDevRuntime,
        this.avgCost,
        this.maxCost,
        this.stdDevCost,
        this.avgEditOperations,
        this.maxEditOperations,
        this.stdDevEditOperations,
      ].map((val) => val.toFixed(2)),
    ];
  }
}


