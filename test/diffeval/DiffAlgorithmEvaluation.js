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

const fs = require("fs");
const {TreeGenerator} = require("../../prototypes/gen/TreeGenerator");
const {GeneratorParameters} = require("../../prototypes/gen/GeneratorParameters");
const {DiffTestInfo} = require("./DiffTestInfo");
const {DiffTestResult} = require("./DiffTestResult");
const {Preprocessor} = require("../../prototypes/parse/Preprocessor");
const {TestConfig} = require("../TestConfig");

class DiffAlgorithmEvaluation {

    adapters;

    constructor(adapters = []) {
        this.adapters = adapters;
    }

    evalAll(caseDir = TestConfig.DIFF_CASES_DIR) {
        console.log("Using " + caseDir + " to evaluate diff algorithms");
        const results = new Map();
        for (const adapter of this.adapters) {
            results.set(adapter, []);
        }

        const parser = new Preprocessor();
        fs.readdirSync(caseDir).forEach((dir) => {
            let oldTree;
            let newTree;
            let testInfo;

            if (dir.startsWith("gen_")) {
                const genParamsJson = fs.readFileSync(caseDir + "/" + dir + "/genParams.json").toString();
                const genParams = Object.assign(new GeneratorParameters(), JSON.parse(genParamsJson));
                const treeGen = new TreeGenerator(genParams);

                console.log("Generating random process tree of size " + genParams.maxSize + "...");
                oldTree = treeGen.randomModel();
                const changedInfo = treeGen.changeModel(oldTree, genParams.numChanges);
                newTree = changedInfo.model;
                testInfo = changedInfo.info;
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

            for (const adapter of this.adapters) {
                console.log("Running case " + testInfo.name + " for " + adapter.constructor.name)
                results.get(adapter).push(adapter.evalCase(testInfo, oldTree, newTree));
            }

        });

        //TODO aggregate metrics
        for (const [adapter, resultsList] of results) {
            console.log("results for " + adapter.constructor.name);
            for (const result of resultsList) {
                console.log(result);
            }
        }
    }


}

exports.DiffAlgorithmEvaluation = DiffAlgorithmEvaluation;