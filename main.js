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


import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import {Config} from "./src/Config.js";
import {MatchPipeline} from "./src/match/MatchPipeline.js";
import {StandardComparator} from "./src/match/compare/StandardComparator.js";
import {Preprocessor} from "./src/io/Preprocessor.js";
import {CpeeDiff} from "./src/diff/CpeeDiff.js";
import {XmlFactory} from "./src/io/XmlFactory.js";
import {DeltaTreeGenerator} from "./src/patch/DeltaTreeGenerator.js";
import {DiffAlgorithmEvaluation} from "./test/diff_eval/DiffAlgorithmEvaluation.js";
import {MergeAlgorithmEvaluation} from "./test/merge_eval/MergeAlgorithmEvaluation.js";
import {MatchingAlgorithmEvaluation} from "./test/match_eval/MatchingAlgorithmEvaluation.js";
import {TestConfig} from "./test/TestConfig.js";

const argv = yargs(hideBin(process.argv))
    .command("diff <old> <new>", "Calculcate and shows the difference between two CPEE process trees", (yargs) => {
        yargs
            .positional("old", {
                description: "The original CPEE process tree as an XML document",
                type: "string"
            })
            .positional("new", {
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
                default: 0.4
            })
            .option("format", {
                description: "Output format",
                alias: "f",
                type: "string",
                choices: ["editScript", "deltaTree"],
                default: "editScript"
            })
            .check(argv => {
                if (!fs.existsSync(argv.old)) {
                    throw new Error(argv.old + " ist not a valid file path");
                }
                if (!fs.existsSync(argv.new)) {
                    throw new Error(argv.new + " ist not a valid file path");
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

        const parser = new Preprocessor();
        const oldTree = parser.parseFromFile(argv.old);
        const newTree = parser.parseFromFile(argv.new);

        const differ = new CpeeDiff(MatchPipeline.standard());
        const editScript = differ.diff(oldTree, newTree, new StandardComparator());

        switch(argv.format) {
            case "editScript": {
                console.log(XmlFactory.serialize(editScript));
                break;
            }
            case "deltaTree": {
                const deltaTreeGen = new DeltaTreeGenerator();
                const deltaTree = deltaTreeGen.deltaTree(oldTree, editScript);
                console.log(XmlFactory.serialize(deltaTree));
                break;
            }
        }
    })
    .command("eval", "Evaluate the CpeeDiff algorithm against other algorithms and variants", (yargs) => {
        yargs
            .option("suite", {
                description: "The test suite to run",
                alias: "s",
                type: "string",
                choices: ["all", "match", "diff", "merge"],
                default: "all"
            })
            .option("timeout", {
                description: "The time limit for each individual test in seconds",
                alias: "t",
                type: "number",
                default: "30"
            })
    }, (argv) => {
        TestConfig.EXECUTION_OPTIONS.timeout = argv.timeout * 1000;
        if(argv.suite === "all" || argv.suite === "match") {
            MatchingAlgorithmEvaluation.all().evalAll(TestConfig.MATCH_CASES_DIR);
        }
        if(argv.suite === "all" || argv.suite === "diff") {
            DiffAlgorithmEvaluation.all().evalAll(TestConfig.DIFF_CASES_DIR);
        }
        if(argv.suite === "all" || argv.suite === "merge") {
            MergeAlgorithmEvaluation.all().evalAll(TestConfig.MERGE_CASES_DIR);
        }
    })
    .help()
    .argv;

