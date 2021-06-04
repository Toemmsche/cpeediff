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
const {TreeStringSerializer} = require("../serialize/TreeStringSerializer");
const {XmlSerializer} = require("../serialize/XmlSerializer");
const {StandardComparator} = require("../compare/StandardComparator");
const {SimilarityMatching} = require("../matching/SimilarityMatching");
const {BottomUpMatching} = require("../matching/BottomUpMatching");
const {Patcher} = require("../patch/Patcher");
const {CpeeModel} = require("../CPEE/CpeeModel");
const {ModelGenerator} = require("../gen/ModelGenerator");
const {DeltaTreeGenerator} = require("../patch/DeltaTreeGenerator");
const {MatchDiff} = require("../diffs/MatchDiff");
const {PathMatching} = require("../matching/PathMatching");
const {TopDownMatching} = require("../matching/TopDownMatching");
const {Parser} = require("../parse/Parser");
const {Merger} = require("../twowaymerge/Merger");
const {CpeeNode} = require("../CPEE/CpeeNode");


let file1 = process.argv[2];
let file2 = process.argv[3];

const xmlA = fs.readFileSync(file1).toString();
const xmlB = fs.readFileSync(file2).toString();

const gen = new ModelGenerator(5000, 10, 20, 23);
/*
const g1 = new CpeeModel(CpeeNode.parseFromJson(fs.readFileSync("prototypes/temp/g1.json").toString()));
const g2 = new CpeeModel(CpeeNode.parseFromJson(fs.readFileSync("prototypes/temp/g2.json").toString()));
*/
 const g1 = gen.randomModel();
 const g2 = gen.randomModel();


let model1 = Parser.fromCpee(xmlA);
let model2 = Parser.fromCpee(xmlB);


console.log(model1.toPreOrderArray().length + " l: " + model1.leafNodes().length + " i: " + (model1.toPostOrderArray().length - model1.leafNodes().length));
console.log(model2.toPreOrderArray().length+ " l: " + model2.leafNodes().length + " i: " + (model2.toPostOrderArray().length - model2.leafNodes().length));


const json = model1.root.convertToJson();
const node = CpeeNode.parseFromJson(json);

function Sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

const start = new Date().getTime();
const delta = MatchDiff.diff(model1, model2, PathMatching);
const end = new Date().getTime();

console.log("diff took " + (end - start) + "ms");
//console.log(delta.toString());
const dt = DeltaTreeGenerator.deltaTree(model1, delta);
//console.log(XmlSerializer.serializeDeltaTree(dt));
console.log(XmlSerializer.serializeDeltaTree(dt));
console.log(TreeStringSerializer.serializeModel(model1));


