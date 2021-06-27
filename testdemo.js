const fs = require("fs");
const {MatchDiff} = require("./src/diff/MatchDiff");
const {DeltaModelGenerator} = require("./src/patch/DeltaModelGenerator");
const {Preprocessor} = require("./src/parse/Preprocessor");
const {DiffTestInfo} = require("./test/diffeval/DiffTestInfo");
const {XmlFactory} = require("./src/factory/XmlFactory");
const {TreeGenerator} = require("./src/gen/TreeGenerator");
const {GeneratorParameters} = require("./src/gen/GeneratorParameters");
const {DeltaJsAdapter} = require("./test/diffeval/DeltaJsAdapter");
const {DiffXmlAdapter} = require("./test/diffeval/DiffXmlAdapter");
const {XmlDiffAdapter} = require("./test/diffeval/XmlDiffAdapter");
const {_3dmMergeAdapter} = require("./test/mergeeval/_3dmMergeAdapter");
const {OurMergeAdapter} = require("./test/mergeeval/OurMergeAdapter");
const {MergeAlgorithmEvaluation} = require("./test/mergeeval/MergeAlgorithmEvaluation");
const {OurDiffAdapter} = require("./test/diffeval/OurDiffAdapter");
const {DiffAlgorithmEvaluation} = require("./test/diffeval/DiffAlgorithmEvaluation");
const {OurMatchAdapter} = require("./test/matcheval/OurMatchAdapter");

const {MatchingAlgorithmEvaluation} = require("./test/matcheval/MatchingAlgorithmEvaluation");

//new MatchingAlgorithmEvaluation([new OurMatchAdapter()]).evalAll();

new DiffAlgorithmEvaluation([new OurDiffAdapter(), new XmlDiffAdapter(), new DiffXmlAdapter(), new DeltaJsAdapter()]).evalAll();

//new MergeAlgorithmEvaluation([new OurMergeAdapter(), new _3dmMergeAdapter()]).evalAll();

/*
const diff = new OurDiffAdapter();


for (let i = 0; i < 10; i++) {
    const gen = new TreeGenerator(new GeneratorParameters(5000, 100, 100, 15, 100));
    const r = gen.randomModel();
    const changed = gen.changeModel(r, 20).model;
    fs.writeFileSync("A.xml", XmlFactory.serialize(r));
    fs.writeFileSync("B.xml", XmlFactory.serialize(changed));
    diff.evalCase(new DiffTestInfo(), r, changed);
}





const r = new Preprocessor().parseFromFile("A.xml");
const s = new Preprocessor().parseFromFile("B.xml");

const delta = new MatchDiff().diff(r,s);

console.log(new DeltaModelGenerator().deltaTree(r, delta).root.deepEquals(s.root));

 */