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

const {CPEEModel} = require("../CPEE/CPEEModel");
const {MatchDiff} = require("../diffs/MatchDiff");
const fs = require("fs");
const {TopDownMatching} = require("../matchings/TopDownMatching");
const {KyongHoMatching} = require("../matchings/KyongHoMatching");
const {UnifiedEditScript} = require("../editscript/UnifiedEditScript");

let file1 = process.argv[2];
let file2 = process.argv[3];

const xmlA = fs.readFileSync(file1).toString();
const xmlB = fs.readFileSync(file2).toString();

const model1 = CPEEModel.fromCPEE(xmlA);
const model2 = CPEEModel.fromCPEE(xmlB);

console.log(model1.toTreeString());
console.log("\n VS \n")
console.log(model2.toTreeString());

const sd = new MatchDiff(model1, model2, TopDownMatching, KyongHoMatching);

const script = sd.diff();
console.log(script.toString("lines"));
script.writeToFile("prototypes/temp/changes.json");

