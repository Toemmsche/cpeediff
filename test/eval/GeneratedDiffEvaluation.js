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

export class GeneratedDiffEvaluation extends DiffAlgorithmEvaluation {


    //TODO init with default value
    constructor(adapters = []) {
       super(adapters);
    }

    static all() {
        let adapters = [new XyDiffAdapter(), new XmlDiffAdapter(), new DiffXmlAdapter(), new DeltaJsAdapter(), new XccAdapter(), new UnixDiffAdapter()];
        adapters = adapters.filter(a => fs.existsSync(a.pathPrefix + "/" + TestConfig.RUN_SCRIPT_FILENAME));
        adapters.unshift(new CpeeDiffAdapter());
        return new GeneratedDiffEvaluation(adapters);
    }

    static fast() {
        let adapters = [new XyDiffAdapter(), new DeltaJsAdapter(), new XccAdapter(), new UnixDiffAdapter()];
        adapters = adapters.filter(a => fs.existsSync(a.pathPrefix + "/" + TestConfig.RUN_SCRIPT_FILENAME));
        adapters.unshift(new CpeeDiffAdapter());
        return new GeneratedDiffEvaluation(adapters);
    }


    evalAll() {
        Logger.info("Evaluating diff algorithms with generated process trees", this);

        //turn off pretty print for efficiency and fairness reasons
        Config.PRETTY_XML = false;

        this._standard();
    }

    _standard() {
        for (let i = 0; i <= TestConfig.GEN.EXP_LIMIT; i++) {
            const size = TestConfig.GEN.INITIAL_SIZE * Math.pow(TestConfig.GEN.FACTOR, i);
            const resultsPerAdapter = new Map(this.adapters.map((a) => [a, []]));

            const genParams = new GeneratorParameters(size, size, Math.log2(size), 3 * Math.log10(size));
            const changeParams = new ChangeParameters(TestConfig.GEN.INITIAL_CHANGES * Math.pow(TestConfig.GEN.FACTOR, i));

            const testId = [size, changeParams.totalChanges].join("_");

            const treeGen = new TreeGenerator(genParams);
            for (let j = 0; j < TestConfig.GEN.REPS; j++) {
                const oldTree = treeGen.randomTree();
                const changedInfo = treeGen.changeTree(oldTree, changeParams);
                const newTree = changedInfo.tree;
                const expected = changedInfo.expected;

                const testCase = new DiffTestCase(testId, oldTree, newTree, expected);

                for(const adapter of this.adapters) {
                    Logger.info("Running rep " + j + " for adapter " + adapter.displayName, this);
                    const result = adapter.evalCase(testCase);
                    if(result.actual != null) {
                        result.actual.cost /= expected.editScript.cost;
                    }
                    resultsPerAdapter.get(adapter).push(result);
                }
            }

            //TODO AggregateDiffResult.of()


            for(const adapter of this.adapters) {
                Logger.info("Results for " + adapter.displayName + " for cases " + testId, this);

                const resultsArr = [DiffTestResult.header(), ...(resultsPerAdapter.get(adapter).map(r => r.values()))];
                Logger.result(markdownTable(resultsArr), this);
            }
        }

    }
}

