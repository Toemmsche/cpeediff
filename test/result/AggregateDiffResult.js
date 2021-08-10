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

export class AggregateDiffResult {

    algorithm;
    caseName;

    avgRuntime;
    maxRuntime;
    stdDevRuntime;

    avgCost;
    maxCost;
    stdDevCost;

    avgChanges;
    maxChanges;
    stdDevChanges;


    constructor(algorithm, caseName, avgRuntime, maxRuntime, stdDevRuntime, avgCost, maxCost, stdDevCost, avgChanges, maxChanges, stdDevChanges) {
        this.algorithm = algorithm;
        this.caseName = caseName;
        this.avgRuntime = avgRuntime;
        this.maxRuntime = maxRuntime;
        this.stdDevRuntime = stdDevRuntime;
        this.avgCost = avgCost;
        this.maxCost = maxCost;
        this.stdDevCost = stdDevCost;
        this.avgChanges = avgChanges;
        this.maxChanges = maxChanges;
        this.stdDevChanges = stdDevChanges;
    }

    values() {
        return [this.algorithm, this.avgRuntime, this.maxRuntime, this.stdDevRuntime, this.avgCost, this.maxCost,
            this.stdDevCost, this.avgChanges, this.maxChanges, this.stdDevChanges];
    }

    static header() {
        return ["algorithm", "avg runtime", "max runtime", "runtime std dev", "avg rel cost", "max rel cost",
           "rel cost std dev", "avg rel changes", "max rel changes", "rel changes std dev"];
    }

    static of(diffResults) {
        //only consider test case executions that didnt result in an error or timeout
        diffResults = diffResults.filter(r => r.isOk());

        const algorithm = diffResults[0].algorithm;
        const caseName = diffResults[0].caseName;

        const runtimes = diffResults.map(r => r.runtime);
        const costs = diffResults.map(r => r.actual.cost);
        const changes = diffResults.map(r => r.actual.changes);

        let [avgRuntime, maxRuntime] = [runtimes.reduce((a, b) => a + b, 0) / runtimes.length, Math.max(...runtimes)];
        let [avgCost, maxCost] = [costs.reduce((a, b) => a + b, 0) / costs.length, Math.max(...costs)];
        let [avgChanges, maxChanges] = [changes.reduce((a, b) => a + b, 0) / changes.length, Math.max(...changes)];

        let stdDevRuntime = Math.sqrt(runtimes.map(r => Math.pow(r - avgRuntime, 2)).reduce((a, b) => a + b, 0) / runtimes.length);
        let stdDevCost = Math.sqrt(costs.map(c => Math.pow(c - avgCost, 2)).reduce((a, b) => a + b, 0)/ costs.length);
        let stdDevChanges = Math.sqrt(changes.map(c => Math.pow(c - avgChanges, 2)).reduce((a, b) => a + b, 0) / changes.length);


        return new AggregateDiffResult(algorithm, caseName, avgRuntime.toFixed(2),
            maxRuntime.toFixed(2), stdDevRuntime.toFixed(2), avgCost.toFixed(2),
            maxCost.toFixed(2), stdDevCost.toFixed(2), avgChanges.toFixed(2),
            maxChanges.toFixed(2), stdDevChanges.toFixed(2));
    }
}


