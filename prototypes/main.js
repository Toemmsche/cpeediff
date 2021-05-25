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
const {CpeeModel} = require("./CPEE/CpeeModel");
const {KyongHoMatching} = require("./matchings/KyongHoMatching");
const {TopDownMatching} = require("./matchings/TopDownMatching");
const {MatchDiff} = require("./diffs/MatchDiff");


const argv = yargs
    .command("diff <oldFile> <newFile>", "Calculcates the difference between two CPEE process models", (yargs) => {
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
            .option("level", {
                description: "Level of the matching granularity",
                alias: "l",
                type: "number",
                default: 1
            })
            .check(argv => {
                if(!fs.existsSync(argv.oldFile)) {
                    throw new Error(argv.oldFile + " ist not a valid file path");
                }
                if(!fs.existsSync(argv.newFile)) {
                    throw new Error(argv.newFile + " ist not a valid file path");
                }
                return true;
            })
        ;
    }, (argv) => {
        const oldModel = CpeeModel.fromCPEE(fs.readFileSync(argv.oldFile).toString());
        const newModel = CpeeModel.fromCPEE(fs.readFileSync(argv.newFile).toString());
        const editScript = MatchDiff.diff(oldModel, newModel, TopDownMatching, KyongHoMatching);
        console.log(editScript.toString("lines"));
    }).argv;

