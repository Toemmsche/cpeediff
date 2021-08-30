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
import {Preprocessor} from '../io/Preprocessor.js';
import {DiffConfig} from '../config/DiffConfig.js';
import {CpeeDiff} from '../CpeeDiff.js';
import {DeltaTreeGenerator} from '../patch/DeltaTreeGenerator.js';
import {GeneratorParameters} from '../../test/gen/GeneratorParameters.js';
import {TreeGenerator} from '../../test/gen/TreeGenerator.js';

DiffConfig.PRETTY_XML = true;

const base = new Preprocessor().parseFromFile('./src/temp/base.xml');
const branch1 = new Preprocessor().parseFromFile('./src/temp/1.xml');

const merge = new DeltaTreeGenerator().extendedDeltaTree(base, new CpeeDiff().diff(base, branch1));

console.log(merge.toXmlString());


console.log(merge.hashEquals(branch1));
console.log(new CpeeDiff().diff(merge, branch1).toXmlString());
console.log(count);

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


