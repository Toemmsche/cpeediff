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

import {Node} from "../tree/Node.js"
import {NodeFactory} from "../tree/NodeFactory.js";
import {TreeGenerator} from "../gen/TreeGenerator.js";
import {GeneratorParameters} from "../gen/GeneratorParameters.js";
import {XmlFactory} from "../io/XmlFactory.js";
import {CpeeDiff} from "../diff/CpeeDiff.js";
import fs from "fs";
import {Preprocessor} from "../io/Preprocessor.js";
import {Config} from "../Config.js";
import {CpeeMerge} from "../merge/CpeeMerge.js";

let booking = "test/test_set/examples/booking.xml";


const  b = fs.readFileSync(booking).toString();
const bm = new Preprocessor().parseWithMetadata(b);



let gen = new TreeGenerator(new GeneratorParameters(10000, 10, 25, 8));


const base = "test/test_set/merge_cases/update_conflict/base.xml";
const b1 = "test/test_set/merge_cases/update_conflict/1.xml";
const b2 = "test/test_set/merge_cases/update_conflict/2.xml";

const bt = new Preprocessor().parseFromFile(base);
const t1 = new Preprocessor().parseFromFile(b1);
const t2 = new Preprocessor().parseFromFile(b2);

new CpeeMerge().merge(bt, t1, t2);




/*
const n = fs.readFileSync("test/test_set/match_cases/generated/new.xml").toString();
const o = fs.readFileSync("test/test_set/match_cases/generated/old.xml").toString();
const nT = new Preprocessor().parseWithMetadata(n);
const oT = new Preprocessor().parseWithMetadata(o);
*/



/*
let tree1 = new Preprocessor().parseWithMetadata(xmlA);
let tree2 =  new Preprocessor().parseWithMetadata(xmlB);
let tree3 =  new Preprocessor().parseWithMetadata(xmlC);




console.log(TreeStringSerializer.serializeTree(tree1));
console.log(TreeStringSerializer.serializeTree(tree2));


const d = new CpeeDiff().diff(tree1, tree2, new ChawatheMatching());
const dt = new DeltaTreeGenerator().deltaTree(tree1, d);


console.log(XmlFactory.serialize(new CpeeMerge().merge(tree1, tree2, tree3)));


*/


