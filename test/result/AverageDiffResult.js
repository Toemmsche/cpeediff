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

export class AverageDiffResult {

  algorithm;
  caseName;

  avgRuntime;
  maxRuntime;
  stdDevRuntime;

  avgCost;
  maxCost;
  stdDevCost;

  avgEditOperations;
  maxEditOperations;
  stdDevEditOperations;

  constructor(caseName, algorithm, avgRuntime, maxRuntime, stdDevRuntime, avgCost, maxCost, stdDevCost, avgEditOperations, maxEditOperations, stdDevEditOperations) {
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
      'rel edit operations std dev'
    ];
  }

  static of(diffResults) {
    // Only consider test case executions that didnt result in an error or
    // timeout
    diffResults = diffResults.filter(r => r.isOk());

    if(diffResults.length === 0) {
      // Cannot produce averages
      return null;
    }

    const algorithm = diffResults[0].algorithm;
    const caseName = diffResults[0].caseName;

    const runtimes = diffResults.map(r => r.runtime);
    const costs = diffResults.map(r => r.actual.cost);
    const changes = diffResults.map(r => r.actual.editOperations);

    let [avgRuntime, maxRuntime] = [
      runtimes.reduce((a, b) => a + b, 0) / runtimes.length,
      Math.max(...runtimes)
    ];
    let [avgCost, maxCost] = [
      costs.reduce((a, b) => a + b, 0) / costs.length,
      Math.max(...costs)
    ];
    let [avgEditOperations, maxEditOperations] = [
      changes.reduce((a, b) => a + b, 0) / changes.length,
      Math.max(...changes)
    ];

    let stdDevRuntime = Math.sqrt(runtimes.map(r => ((r - avgRuntime) ** 2))
        .reduce((a, b) => a + b, 0) / runtimes.length);
    let stdDevCost = Math.sqrt(costs.map(c => ((c - avgCost) ** 2))
        .reduce((a, b) => a + b, 0) / costs.length);
    let stdDevEditOperations = Math.sqrt(changes.map(c => ((c - avgEditOperations) ** 2))
        .reduce((a, b) => a + b, 0) / changes.length);

    return new AverageDiffResult(caseName, algorithm, avgRuntime.toFixed(2),
        maxRuntime.toFixed(2), stdDevRuntime.toFixed(2), avgCost.toFixed(2),
        maxCost.toFixed(2), stdDevCost.toFixed(2), avgEditOperations.toFixed(2),
        maxEditOperations.toFixed(2), stdDevEditOperations.toFixed(2)
    );
  }

  values() {
    return [
      this.algorithm,
      this.avgRuntime,
      this.maxRuntime,
      this.stdDevRuntime,
      this.avgCost,
      this.maxCost,
      this.stdDevCost,
      this.avgEditOperations,
      this.maxEditOperations,
      this.stdDevEditOperations
    ];
  }
}


