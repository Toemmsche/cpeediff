import {DiffAlgorithmEvaluation} from "./test/diffeval/DiffAlgorithmEvaluation.js";
import {OurDiffAdapter} from "./test/diffeval/OurDiffAdapter.js";
import {XmlDiffAdapter} from "./test/diffeval/XmlDiffAdapter.js";
import {DiffXmlAdapter} from "./test/diffeval/DiffXmlAdapter.js";
import {DeltaJsAdapter} from "./test/diffeval/DeltaJsAdapter.js";
import {XccAdapter} from "./test/diffeval/XccAdapter.js";

//new MatchingAlgorithmEvaluation([new OurMatchAdapter()]).evalAll();

new DiffAlgorithmEvaluation([new OurDiffAdapter(), new XmlDiffAdapter(), new DiffXmlAdapter(), new DeltaJsAdapter(), new XccAdapter()]).evalAll();

//new MergeAlgorithmEvaluation([new OurMergeAdapter(), new _3dmMergeAdapter()]).evalAll();

/*
const diff = new OurDiffAdapter();


for (let i = 0; i < 10; i++) {
    const gen = new TreeGenerator(new GeneratorParameters(5000, 100, 100, 15, 100));
    const r = gen.randomTree();
    const changed = gen.changeTree(r, 20).tree;
    fs.writeFileSync("A.xml", XmlFactory.serialize(r));
    fs.writeFileSync("B.xml", XmlFactory.serialize(changed));
    diff.evalCase(new DiffTestInfo(), r, changed);
}


const r = new Preprocessor().parseFromFile("A.xml");
const s = new Preprocessor().parseFromFile("B.xml");

const delta = new MatchDiff().diff(r,s);

console.log(new DeltaTreeGenerator().deltaTree(r, delta).deepEquals(s));

 */