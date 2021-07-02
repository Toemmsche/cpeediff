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
import {Preprocessor} from "../../src/parse/Preprocessor.js";
import * as fs from "fs";
import {TreeGenerator} from "../../src/gen/TreeGenerator.js";
import {GeneratorParameters} from "../../src/gen/GeneratorParameters.js";
import {DiffTestInfo} from "./DiffTestInfo.js";
import {MarkDownFactory} from "../MarkDownFactory.js";
import {CpeeDiffAdapter} from "./CpeeDiffAdapter.js";
import {XmlDiffAdapter} from "./XmlDiffAdapter.js";
import {DiffXmlAdapter} from "./DiffXmlAdapter.js";
import {DeltaJsAdapter} from "./DeltaJsAdapter.js";
import {XccAdapter} from "./XccAdapter.js";

export class DiffAlgorithmEvaluation {

    adapters;

    constructor(adapters = []) {
        this.adapters = adapters;
    }

    static all() {
        let adapters = [new XmlDiffAdapter(), new DiffXmlAdapter(), new DeltaJsAdapter(), new XccAdapter()];
        adapters = adapters.filter(a => fs.existsSync(a.pathPrefix + "/run.sh"));
        adapters.unshift(new CpeeDiffAdapter());
        return new DiffAlgorithmEvaluation(adapters);
    }

    evalAll(caseDir = TestConfig.DIFF_CASES_DIR) {
        console.log("Using " + caseDir + " to evaluate diff algorithms");

        const resultsPerAdapter = new Map();
        const resultsPerTest = new Map();
        for (const adapter of this.adapters) {
            resultsPerAdapter.set(adapter, []);
        }

        const parser = new Preprocessor();
        fs.readdirSync(caseDir).forEach((dir) => {
            let oldTree;
            let newTree;
            let testInfo;

            if (dir.startsWith("gen_")) {
                if(!fs.existsSync(caseDir + "/" + dir + "/genParams.json")) {
                   return;
                }
                const genParamsJson = fs.readFileSync(caseDir + "/" + dir + "/genParams.json").toString();
                const genParams = Object.assign(new GeneratorParameters(), JSON.parse(genParamsJson));
                const treeGen = new TreeGenerator(genParams);

                switch(dir) {
                    case "gen_leaves_only_shuffled":  {
                        console.log("Generating process tree with only leaves of size " + genParams.maxSize);
                        oldTree = treeGen.randomLeavesOnly();
                        const changedInfo = treeGen.reshuffleAll(oldTree);
                        newTree = changedInfo.tree;
                        testInfo = changedInfo.info;
                        break;
                    }
                    default: {
                        console.log("Generating random process tree of size " + genParams.maxSize);
                        oldTree = treeGen.randomTree();
                        const changedInfo = treeGen.changeTree(oldTree, genParams.numChanges);
                        newTree = changedInfo.tree;
                        testInfo = changedInfo.info;
                        break;
                    }
                }
                testInfo.name = dir;
            } else {
                fs.readdirSync(caseDir + "/" + dir).forEach((file) => {
                        const content = fs.readFileSync(caseDir + "/" + dir + "/" + file).toString();
                        if (file === "new.xml") {
                            newTree = parser.parseWithMetadata(content);
                        } else if (file === "old.xml") {
                            oldTree = parser.parseWithMetadata(content);
                        } else if (file === "info.json") {
                            testInfo = Object.assign(new DiffTestInfo(), JSON.parse(content));
                            testInfo.name = dir;
                        }
                    }
                );
                if (oldTree == null || newTree == null || testInfo == null) {
                    //test case is incomplete => skip
                    return;
                }
            }


            resultsPerTest.set(testInfo, []);
            for (const adapter of this.adapters) {
                console.log("Running diff case " + testInfo.name + " for " + adapter.displayName);

                const result = adapter.evalCase(testInfo, oldTree, newTree);
                resultsPerAdapter.get(adapter).push(result);
                resultsPerTest.get(testInfo).push(result);
            }
        });

        //TODO aggregate metrics
        for(const [testInfo, results] of resultsPerTest) {
            console.log("Results for case");
            console.log(testInfo);
            console.log(MarkDownFactory.tabularize(results));
        }
    }


}

