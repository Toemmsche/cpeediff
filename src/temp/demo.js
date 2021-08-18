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

import {Node} from '../tree/Node.js';
import {XmlFactory} from '../io/XmlFactory.js';
import {CpeeDiff} from '../diff/CpeeDiff.js';
import {Preprocessor} from '../io/Preprocessor.js';
import {Config} from '../Config.js';
import {DeltaTreeGenerator} from '../patch/DeltaTreeGenerator.js';
import {Logger} from '../../util/Logger.js';
import {HashExtractor} from '../extract/HashExtractor.js';
import {DeltaNode} from '../patch/DeltaNode.js';

Logger.enableLogging();
Config.LOG_LEVEL = 'all';




const base = new Preprocessor().parseFromFile('old.xml');
const newTree = new Preprocessor().parseFromFile('new.xml');

const es = new CpeeDiff().diff(base, newTree);

const deltaTree = Node.fromNode(new DeltaTreeGenerator().deltaTree(base, es));

const h = new HashExtractor();
console.log(h.get(newTree) === h.get(deltaTree));

console.log(XmlFactory.serialize(es));
console.log(XmlFactory.serialize(deltaTree));



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


