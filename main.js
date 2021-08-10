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
import {hideBin} from 'yargs/helpers'
import {Config} from "./src/Config.js";
import {Preprocessor} from "./src/io/Preprocessor.js";
import {CpeeDiff} from "./src/diff/CpeeDiff.js";
import {XmlFactory} from "./src/io/XmlFactory.js";
import {DeltaTreeGenerator} from "./src/patch/DeltaTreeGenerator.js";
import {DiffAlgorithmEvaluation} from "./test/eval/DiffAlgorithmEvaluation.js";
import {MergeAlgorithmEvaluation} from "./test/eval/MergeAlgorithmEvaluation.js";
import {MatchingAlgorithmEvaluation} from "./test/eval/MatchingAlgorithmEvaluation.js";
import {TestConfig} from "./test/TestConfig.js";
import * as fs from "fs";
import {Logger} from "./util/Logger.js";
import {CpeeMerge} from "./src/merge/CpeeMerge.js";
import {NodeFactory} from "./src/tree/NodeFactory.js";
import {MatchPipeline} from "./src/match/MatchPipeline.js";

const argv = yargs(hideBin(process.argv))
    .command("diff <old> <new>", "Calculcate and show the difference between two CPEE process trees", (yargs) => {
        yargs
            .positional("old", {
                description: "The original CPEE process tree as an XML document",
                type: "string"
            })
            .positional("new", {
                description: "The changed CPEE process tree as an XML document",
                type: "string"
            })
            .option("mode", {
                description: "The matching mode to be used. This affects the performance and quality of the diff algorithm.",
                alias: "m",
                type: "string",
                choices: Object.values(Config.MATCH_MODES),
                default: Config.MATCH_MODES.QUALITY
            })
            .option("threshold", {
                description: "Similarity threshold for matching nodes",
                alias: "t",
                type: "number",
                default: 0.4
            })
            .option("variablePrefix", {
                description: "Prefix used to detect read/written variables in code and arguments",
                alias: "p",
                type: "string",
                default: "data."
            })
            .option("addInitScript", {
                description: "Add a <manipulate> element at the beginning of the tree that initializes all declared data variables",
                alias: "s",
                type: "boolean",
                default: false
            })
            .option("format", {
                description: "Output format",
                alias: "f",
                type: "string",
                choices: ["editScript", "deltaTree"],
                default: "editScript"
            })
            .option("verbose", {
                description: "Provide extended log messages. Warning: This includes a lot of stats about the performance of each algorithm component.",
                alias: "v",
                type: "boolean",
                default: false
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
        if (argv.verbose) {
            Logger.enableLogging();
        } else {
            //Disabling logging does not affect the output of results
            Logger.disableLogging();
        }
        //configure instance
        Config.ADD_INIT_SCRIPT = argv.addInitScript;
        Config.VARIABLE_PREFIX = argv.variablePrefix;
        Config.COMPARISON_THRESHOLD = argv.threshold;
        Config.MATCH_MODE = argv.mode;

        const parser = new Preprocessor();
        const oldTree = parser.parseFromFile(argv.old);
        const newTree = parser.parseFromFile(argv.new);

        const editScript = new CpeeDiff(MatchPipeline.fromMode()).diff(oldTree, newTree);

        switch (argv.format) {
            case "editScript": {
                Logger.result((XmlFactory.serialize(editScript)));
                break;
            }
            case "deltaTree": {
                const deltaTreeGen = new DeltaTreeGenerator();
                const deltaTree = deltaTreeGen.deltaTree(oldTree, editScript);
                Logger.result((XmlFactory.serialize(deltaTree)));
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
                default: 30
            })
            .option("gen", {
                description: "Run tests with randomly generated models",
                alias: "r",
                type: "boolean",
                default: false
            })
            .option("verbose", {
                description: "Provide extended log messages",
                alias: "v",
                type: "boolean",
                default: true
            })
    }, (argv) => {
        if (argv.verbose) {
            Logger.enableLogging();
        } else {
            Logger.disableLogging();
        }
        TestConfig.EXECUTION_OPTIONS.timeout = argv.timeout * 1000;
        TestConfig.RUN_AUTOGENERATED_TESTS = argv.gen;
        if (argv.suite === "all" || argv.suite === "match") {
            MatchingAlgorithmEvaluation.all().evalAll(TestConfig.MATCH_CASES_DIR);
        }
        if (argv.suite === "all" || argv.suite === "diff") {
            DiffAlgorithmEvaluation.all().evalAll(TestConfig.DIFF_CASES_DIR);
        }
        if (argv.suite === "all" || argv.suite === "merge") {
            MergeAlgorithmEvaluation.all().evalAll(TestConfig.MERGE_CASES_DIR);
        }
    })
    .command("merge <base> <branch1> <branch2>", "Perform a three-way merge for process trees", (yargs) => {
        yargs
            .positional("base", {
                description: "The base CPEE process tree as an XML document",
                type: "string"
            })
            .positional("branch1", {
                description: "The first branch CPEE process tree as an XML document",
                type: "string"
            })
            .positional("branch2", {
                description: "The second branch CPEE process tree as an XML document",
                type: "string"
            })
            .option("verbose", {
            description: "Provide extended log messages",
            alias: "v",
            type: "boolean",
            default: false
        })
    }, (argv) => {
        if (argv.verbose) {
            Logger.enableLogging();
        } else {
            Logger.disableLogging();
        }
        //parse
        const parser = new Preprocessor();
        const base = parser.parseFromFile(argv.base);
        const branch1 = parser.parseFromFile(argv.branch1);
        const branch2 = parser.parseFromFile(argv.branch2);

        //merge
        const merger = new CpeeMerge();
        const merged = merger.merge(base, branch1, branch2);

        //print normal tree (no merge or delta annotations)
        Logger.result(XmlFactory.serialize(NodeFactory.getNode(merged)));
    })
    .help()
    .demandCommand()
    .strictCommands()
    .argv;


