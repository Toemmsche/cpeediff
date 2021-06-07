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
const {XmlSerializer} = require("./serialize/XmlSerializer");
const {TreeStringSerializer} = require("./serialize/TreeStringSerializer");
const {DeltaTreeGenerator} = require("./patch/DeltaModelGenerator");
const {Config} = require("./Config");
const {PathMatching} = require("./matching/PathMatching");
const {Parser} = require("./parse/Parser");
const {MatchDiff} = require("./diffs/MatchDiff");


const argv = yargs
    .command("diff <oldFile> <newFile>", "Calculcates and shows the difference between two CPEE process models", (yargs) => {
        yargs
            .positional("oldFile", {
                description: "The original CPEE process model as an XML document",
                type: "string"
            })
            .positional("newFile", {
                description: "The changed CPEE process model as an XML document",
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

        const oldModel = Parser.fromCpee(fs.readFileSync(argv.oldFile).toString());
        const newModel = Parser.fromCpee(fs.readFileSync(argv.newFile).toString());

        const editScript = MatchDiff.diff(oldModel, newModel, PathMatching);

        switch (argv.format) {
            case "deltaTree": {
                const deltaTree = DeltaTreeGenerator.deltaTree(oldModel, editScript);
                console.log(TreeStringSerializer.serializeDeltaTree(deltaTree));
                break;
            }
            case "deltaXml": {
                const deltaTree = DeltaTreeGenerator.deltaTree(oldModel, editScript);
                console.log(XmlSerializer.serializeDeltaTree(deltaTree));
                break;
            }
            case "operations":
            default: {
                console.log(editScript.toString());
                break;
            }
        }
    }).argv;

