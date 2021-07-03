#!/usr/bin/env node

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


const yargs = require("yargs");
const fs = require("fs");
const {CpeeDiffAdapter} = require("./test/diffeval/OurDiffAdapter");
const {DiffAlgorithmEvaluation} = require("./test/diffeval/DiffAlgorithmEvaluation");
const {XmlFactory} = require("./src/factory/XmlFactory");
const {DeltaJsAdapter} = require("./test/diffeval/DeltaJsAdapter");
const {DiffXmlAdapter} = require("./test/diffeval/DiffXmlAdapter");
const {XmlDiffAdapter} = require("./test/diffeval/XmlDiffAdapter");
const {TestConfig} = require("./test/TestConfig");
const {TreeStringSerializer} = require("./src/visual/TreeStringSerializer");
const {DeltaTreeGenerator} = require("./src/patch/DeltaTreeGenerator");
const {Config} = require("./src/Config");
const {PathMatching} = require("./src/matching/PathMatching");
const {Parser} = require("./src/parse/Preprocessor");
const {CpeeDiff} = require("./src/diff/CpeeDiff");


const argv = yargs
    .command("diff <oldFile> <newFile>", "Calculcates and shows the difference between two CPEE process trees", (yargs) => {
        yargs
            .positional("oldFile", {
                description: "The original CPEE process tree as an XML document",
                type: "string"
            })
            .positional("newFile", {
                description: "The changed CPEE process tree as an XML document",
                type: "string"
            })
            .option("leafThreshold", {
                description: "Similarity Threshold for matching leaf nodes",
                alias: "t",
                type: "number",
                default: 0.25
            })
            .option("innerThreshold", {
                description: "Similarity Threshold for matching inner nodes",
                alias: "i",
                type: "number",
                default: 0.25
            })
            .option("format", {
                description: "Output format",
                alias: "f",
                type: "string",
                choices: ["operations", "deltaTree", "deltaXml"],
                default: "operations"
            })
            .check(argv => {
                if (!fs.existsSync(argv.oldFile)) {
                    throw new Error(argv.oldFile + " ist not a valid file path");
                }
                if (!fs.existsSync(argv.newFile)) {
                    throw new Error(argv.newFile + " ist not a valid file path");
                }

                if (argv.leafThreshold < 0 || argv.leafThreshold > 1) {
                    throw new Error("leafThreshold must be in [0,1]");
                }
                if (argv.innerThreshold < 0 || argv.innerThreshold > 1) {
                    throw new Error("innerThreshold must be in [0,1]");
                }

                return true;
            })
        ;
    }, (argv) => {
        Config.LEAF_SIMILARITY_THRESHOLD = argv.leafThreshold;
        Config.INNER_NODE_SIMILARITY_THRESHOLD = argv.innerThreshold;

        const oldTree = Parser.fromCpee(fs.readFileSync(argv.oldFile).toString());
        const newTree = Parser.fromCpee(fs.readFileSync(argv.newFile).toString());

        const editScript = CpeeDiff.diff(oldTree, newTree, PathMatching);

        switch (argv.format) {
            case "deltaTree": {
                const deltaTree = DeltaTreeGenerator.deltaTree(oldTree, editScript);
                console.log(TreeStringSerializer.serializeDeltaTree(deltaTree));
                break;
            }
            case "deltaXml": {
                const deltaTree = DeltaTreeGenerator.deltaTree(oldTree, editScript);
                console.log(XmlFactory.serialize(deltaTree));
                break;
            }
            case "operations":
            default: {
                console.log(editScript.toString());
                break;
            }
        }
    })
    .command("eval", "Evaluates the semantic diff algorithm against other algorithms and variants", (yargs) => {
        yargs
            .option("suite", {
                description: "The test suite to run",
                alias: "s",
                type: "string",
                choices: ["all", "match", "diff", "merge"],
                default: "all"
            });
    }, (argv) => {
        if(argv.suite === "all" || argv.suite === "diff") {
            //ensure the existence of the algorithms to be compared against
            const diffAdapters = [];
            CpeeDiffAdapter.register(diffAdapters);
            XmlDiffAdapter.register(diffAdapters);
            DiffXmlAdapter.register(diffAdapters);
            DeltaJsAdapter.register(diffAdapters);
            new DiffAlgorithmEvaluation(diffAdapters).evalAll();
        }
    }).argv;

