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
import * as fs from "fs";
import {MarkDownFactory} from "../util/MarkDownFactory.js";
import {CpeeDiffAdapter} from "../diff_adapters/CpeeDiffAdapter.js";
import {XmlDiffAdapter} from "../diff_adapters/XmlDiffAdapter.js";
import {DiffXmlAdapter} from "../diff_adapters/DiffXmlAdapter.js";
import {DeltaJsAdapter} from "../diff_adapters/DeltaJsAdapter.js";
import {XccAdapter} from "../diff_adapters/XccAdapter.js";
import {UnixDiffAdapter} from "../diff_adapters/UnixDiffAdapter.js";
import {XyDiffAdapter} from "../diff_adapters/XyDiffAdapter.js";
import {Logger} from "../../Logger.js";
import {DirectoryScraper} from "../util/DirectoryScraper.js";
import {DiffTestCase} from "../case/DiffTestCase.js";

export class DiffAlgorithmEvaluation {

    adapters;

    constructor(adapters = []) {
        this.adapters = adapters;
    }

    static all() {
        let adapters = [new XyDiffAdapter(), new XmlDiffAdapter(), new DiffXmlAdapter(), new DeltaJsAdapter(), new XccAdapter(), new UnixDiffAdapter()];
        adapters = adapters.filter(a => fs.existsSync(a.pathPrefix + "/" + TestConfig.RUN_SCRIPT_FILENAME));
        adapters.unshift(new CpeeDiffAdapter());
        return new DiffAlgorithmEvaluation(adapters);
    }

    static fast() {
        let adapters = [new XyDiffAdapter(), new DeltaJsAdapter(), new XccAdapter(), new UnixDiffAdapter()];
        adapters = adapters.filter(a => fs.existsSync(a.pathPrefix + "/" + TestConfig.RUN_SCRIPT_FILENAME));
        adapters.unshift(new CpeeDiffAdapter());
        return new DiffAlgorithmEvaluation(adapters);
    }

    evalAll(rootDir = TestConfig.DIFF_CASES_DIR) {
        Logger.info("Using " + rootDir + " to evaluate diff algorithms", this);

        const resultsPerAdapter = new Map();
        const resultsPerTest = new Map();
        for (const adapter of this.adapters) {
            resultsPerAdapter.set(adapter, []);
        }

        //collect all directories representing testCases
        const caseDirs = DirectoryScraper.scrape(rootDir);
        for(const testCaseDir of caseDirs) {
            const testCase = DiffTestCase.from(testCaseDir);

            if(testCase == null) {
                Logger.warn("Skipping diff case directory " + testCaseDir, this);
                continue;
            }

            resultsPerTest.set(testCase, []);
            for (const adapter of this.adapters) {
                Logger.info("Running diff case " + testCase.name + " for " + adapter.displayName + "...", this);

                const result = adapter.evalCase(testCase);
                resultsPerAdapter.get(adapter).push(result);
                resultsPerTest.get(testCase).push(result);
            }
        }

        //TODO aggregate metrics
        for (const [testCase, results] of resultsPerTest) {
            Logger.result("Results for case " + testCase.name, this);
            Logger.result(testCase, this);
            Logger.result("\n" + MarkDownFactory.tabularize(results), this);
        }
    }


}

