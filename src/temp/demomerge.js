const fs = require('fs');
const {Merger} = require('../twowaymerge/Merger');
const {CpeeTree} = require('../tree/CpeeTree');
const {EditScriptParser} = require('../twowaymerge/EditScriptParser');

const changes = EditScriptParser.parseFromFile('./prototypes/temp/changes.json');
let file1 = 'test_set/standard_A_mod.xml.js';
const xmlA = fs.readFileSync(file1).toString();
const tree1 = CpeeTree.fromCPEE(xmlA);
Merger.merge(tree1, changes);