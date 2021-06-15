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
const {ChawatheMatching} = require("../matching/ChawatheMatch");
const {Preprocessor} = require("../parse/Preprocessor");
const {DeltaMerger} = require("../merge/DeltaMerger");
const {MatchMerger} = require("../merge/MatchMerger");
const {TreeStringSerializer} = require("../serialize/TreeStringSerializer");
const {XmlSerializer} = require("../serialize/XmlSerializer");
const {StandardComparator} = require("../compare/StandardComparator");
const {SimilarityMatching} = require("../matching/SimilarityMatching");
const {BottomUpMatching} = require("../matching/BottomUpMatching");
const {Patcher} = require("../patch/Patcher");
const {CpeeModel} = require("../cpee/CpeeModel");
const {ModelGenerator} = require("../gen/ModelGenerator");
const {DeltaModelGenerator} = require("../patch/DeltaModelGenerator");
const {MatchDiff} = require("../diffs/MatchDiff");
const {PathMatching} = require("../matching/PathMatching");
const {TopDownMatching} = require("../matching/TopDownMatching");
const {CpeeNode} = require("../cpee/CpeeNode");


let file1 = process.argv[2];
let file2 = process.argv[3];
let file3 = process.argv[4];

let booking = "test_set/real/booking.xml";

const xmlA = fs.readFileSync(file1).toString();
const xmlB = fs.readFileSync(file2).toString();
const xmlC = fs.readFileSync(file3).toString();

const bookingXML = fs.readFileSync(booking).toString();

let bm = new Preprocessor().prepare(bookingXML);
console.log(bm.convertToXml());

let model1 = new Preprocessor().prepare(xmlA);
let model2 =  new Preprocessor().prepare(xmlB);
let model3 =  new Preprocessor().prepare(xmlC);




console.log(model1.toPreOrderArray().length + " l: " + model1.leafNodes().length + " i: " + (model1.toPostOrderArray().length - model1.leafNodes().length));
console.log(model2.toPreOrderArray().length+ " l: " + model2.leafNodes().length + " i: " + (model2.toPostOrderArray().length - model2.leafNodes().length));


const d = MatchDiff.diff(model1, model2, ChawatheMatching);
const dt = DeltaModelGenerator.deltaTree(model1, d);
console.log(TreeStringSerializer.serializeDeltaTree(dt));

console.log(TreeStringSerializer.serializeModel(model1));
console.log(TreeStringSerializer.serializeModel(model2));

DeltaMerger.merge(model1, model2, model3);

//MatchMerger.merge(model1, model2, model3);


/*

const start = new Date().getTime();
const delta = MatchDiff.diff(model1, model2, PathMatching);
const end = new Date().getTime();
console.log(delta.toString());

console.log("diff took " + (end - start) + "ms");
*/



