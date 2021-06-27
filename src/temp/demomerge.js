const fs = require("fs");
const {Merger} = require("../twowaymerge/Merger");
const {CpeeModel} = require("../cpee/CpeeModel");
const {EditScriptParser} = require("../twowaymerge/EditScriptParser");

const changes = EditScriptParser.parseFromFile("./prototypes/temp/changes.json");
let file1 = "test_set/standard_A_mod.xml";
const xmlA = fs.readFileSync(file1).toString();
const model1 = CpeeModel.fromCPEE(xmlA);
Merger.merge(model1, changes);