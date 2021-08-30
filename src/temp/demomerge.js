import {GeneratorParameters} from '../../test/gen/GeneratorParameters.js';
import {TreeGenerator} from '../../test/gen/TreeGenerator.js';
import {ChangeParameters} from '../../test/gen/ChangeParameters.js';
import {CpeeDiffAdapter} from '../../test/diff_adapters/CpeeDiffAdapter.js';
import {CpeeDiff} from '../CpeeDiff.js';
import {DiffConfig} from '../config/DiffConfig.js';

DiffConfig.LOG_LEVEL = 'all';
const genParams = new GeneratorParameters(50000, 1000, 25, 8);
const treeGen = new TreeGenerator(genParams);

const base = treeGen.randomTree();

const c = treeGen.changeTree(base, new ChangeParameters(5000, false))[0].newTree;

console.log(new CpeeDiff().diff(base, c));

/*
const changeParams = new ChangeParameters(5);
const b1 = treeGen.changeTree(base, changeParams)[0].newTree;
console.log('Size of b1 ', b1.size());
const b2 = treeGen.changeTree(base, changeParams)[0].newTree;
console.log('Size of b2 ', b2.size());

const merge = new CpeeMerge().merge(base, b1, b2);

Config.PRETTY_XML = true;
console.log("Base : ", base.toXmlString());
console.log("Branch 1: ", b1.toXmlString());
console.log("Branch 2: ", b2.toXmlString());
console.log("Merged: ",merge.toXmlString());

 */