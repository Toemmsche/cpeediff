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

import {TestConfig} from "../TestConfig.js";

import {Logger} from "../../util/Logger.js";
import {Config} from "../../src/Config.js";
import {DiffAlgorithmEvaluation} from "./DiffAlgorithmEvaluation.js";
import {GeneratorParameters} from "../gen/GeneratorParameters.js";
import {TreeGenerator} from "../gen/TreeGenerator.js";
import {ChangeParameters} from "../gen/ChangeParameters.js";
import {DiffTestCase} from "../case/DiffTestCase.js";
import {DiffTestResult} from "../result/DiffTestResult.js";
import {markdownTable} from "markdown-table";
import {XyDiffAdapter} from "../diff_adapters/XyDiffAdapter.js";
import {XmlDiffAdapter} from "../diff_adapters/XmlDiffAdapter.js";
import {DiffXmlAdapter} from "../diff_adapters/DiffXmlAdapter.js";
import {DeltaJsAdapter} from "../diff_adapters/DeltaJsAdapter.js";
import {XccAdapter} from "../diff_adapters/XccAdapter.js";
import {UnixDiffAdapter} from "../diff_adapters/UnixDiffAdapter.js";
import fs from "fs";
import {CpeeDiffAdapter} from "../diff_adapters/CpeeDiffAdapter.js";
import {AggregateDiffResult} from "../result/AggregateDiffResult.js";

export class GeneratedDiffEvaluation extends DiffAlgorithmEvaluation {


    //TODO init with default value
    constructor(adapters = []) {
        super(adapters);
    }

    static all() {
        let adapters = [new XyDiffAdapter(), new XmlDiffAdapter(), new DiffXmlAdapter(), new DeltaJsAdapter(), new XccAdapter()];
        adapters = adapters.filter(a => fs.existsSync(a.pathPrefix + "/" + TestConfig.RUN_SCRIPT_FILENAME));
        adapters.unshift(new CpeeDiffAdapter());
        return new GeneratedDiffEvaluation(adapters);
    }

    static fast() {
        let adapters = [new XyDiffAdapter(), new DeltaJsAdapter(), new XccAdapter()];
        adapters = adapters.filter(a => fs.existsSync(a.pathPrefix + "/" + TestConfig.RUN_SCRIPT_FILENAME));
        adapters.unshift(new CpeeDiffAdapter());
        return new GeneratedDiffEvaluation(adapters);
    }


    evalAll() {
        Logger.info("Evaluating diff algorithms with generated process trees", this);

        //turn off pretty print for efficiency and fairness reasons
        Config.PRETTY_XML = false;

        //Simply run all functions...
        this.standardSingle();
        this.standardAggregate();
    }

    standardSingle() {
        Logger.info("Standard evaluation of diff algorithms", this);
        for (let i = 0; i <= TestConfig.GEN.EXP_LIMIT; i++) {
            const size = TestConfig.GEN.INITIAL_SIZE * Math.pow(TestConfig.GEN.FACTOR, i);

            //choose sensible generator and change parameters
            const genParams = new GeneratorParameters(size, size, Math.ceil(Math.log2(size)), Math.ceil(Math.log10(size)));
            const changeParams = new ChangeParameters(TestConfig.GEN.INITIAL_CHANGES * Math.pow(TestConfig.GEN.FACTOR, i));

            const testId = [size, changeParams.totalChanges].join("_");

            const treeGen = new TreeGenerator(genParams);

            const oldTree = treeGen.randomTree();
            const changedInfo = treeGen.changeTree(oldTree, changeParams);
            const newTree = changedInfo.tree;
            const expected = changedInfo.expected;

            const testCase = new DiffTestCase(testId, oldTree, newTree, expected);

            //Run test case for each diff algorithm
            const results = [];
            for (const adapter of this.adapters) {
                Logger.info("Running case " + testId + " for adapter " + adapter.displayName, this);
                const result = adapter.evalCase(testCase);
                results.push(result);
            }

            //Add expected values to table
            const table = [DiffTestResult.header(), expected.values(), ...results.map(r => r.values())];
            Logger.result(markdownTable(table));
        }
    }

    flatSingle() {
        Logger.info("Standard evaluation of diff algorithms with constant changes", this);
        for (let i = 0; i <= TestConfig.GEN.EXP_LIMIT; i++) {
            const size = TestConfig.GEN.INITIAL_SIZE * Math.pow(TestConfig.GEN.FACTOR, i);

            //choose sensible generator and change parameters
            const genParams = new GeneratorParameters(size, size, Math.ceil(Math.log2(size)), Math.ceil( Math.log10(size)));
            const changeParams = new ChangeParameters(TestConfig.GEN.INITIAL_CHANGES);

            const testId = [size, changeParams.totalChanges].join("_");

            const treeGen = new TreeGenerator(genParams);

            const oldTree = treeGen.randomTree();
            const changedInfo = treeGen.changeTree(oldTree, changeParams);
            const newTree = changedInfo.tree;
            const expected = changedInfo.expected;

            const testCase = new DiffTestCase(testId, oldTree, newTree, expected);

            //Run test case for each diff algorithm
            const results = [];
            for (const adapter of this.adapters) {
                Logger.info("Running case " + testId + " for adapter " + adapter.displayName, this);
                const result = adapter.evalCase(testCase);
                results.push(result);
            }

            //Add expected values to table
            const table = [DiffTestResult.header(), expected.values(), ...results.map(r => r.values())];
            Logger.result(markdownTable(table));
        }
    }

    standardAggregate() {
        Logger.info("Aggregate evaluation of diff algorithms", this);
        for (let i = 0; i <= TestConfig.GEN.EXP_LIMIT; i++) {
            const size = TestConfig.GEN.INITIAL_SIZE * Math.pow(TestConfig.GEN.FACTOR, i);
            const resultsPerAdapter = new Map(this.adapters.map((a) => [a, []]));

            const genParams = new GeneratorParameters(size, size, Math.ceil(Math.log2(size)), Math.ceil( Math.log10(size)));
            const changeParams = new ChangeParameters(TestConfig.GEN.INITIAL_CHANGES * Math.pow(TestConfig.GEN.FACTOR, i));

            const testId = [size, changeParams.totalChanges].join("_");

            const treeGen = new TreeGenerator(genParams);
            for (let j = 0; j < TestConfig.GEN.REPS; j++) {
                const oldTree = treeGen.randomTree();
                const changedInfo = treeGen.changeTree(oldTree, changeParams);
                const newTree = changedInfo.tree;
                const expected = changedInfo.expected;

                const testCase = new DiffTestCase(testId, oldTree, newTree, expected);

                for (const adapter of this.adapters) {
                    Logger.info("Running rep " + j + " for adapter " + adapter.displayName, this);
                    const result = adapter.evalCase(testCase);
                    if (result.isOk()) {
                        result.actual.cost /= expected.editScript.cost;
                        result.actual.changes /= expected.editScript.totalChanges();
                    }
                    resultsPerAdapter.get(adapter).push(result);
                }
            }
            const aggregateResults = [...resultsPerAdapter.entries()].map(e => AggregateDiffResult.of(e[1]));
            const table = [new Array(10).fill("A"), ...(aggregateResults.map(r => r.values()))];
            Logger.result("Results for cases " + testId);
            Logger.result(markdownTable(table));
        }

    }
}

