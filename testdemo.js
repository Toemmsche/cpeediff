
import {DiffAlgorithmEvaluation} from "./test/eval/DiffAlgorithmEvaluation.js";
import {CpeeDiffAdapter} from "./test/diff_adapters/CpeeDiffAdapter.js";
import {XyDiffAdapter} from "./test/diff_adapters/XyDiffAdapter.js";
import {TestConfig} from "./test/TestConfig.js";
import {CpeeDiffLocalAdapter} from "./test/diff_adapters/CpeeDiffLocalAdapter.js";
import {Config} from "./src/Config.js";
import {MatchingAlgorithmEvaluation} from "./test/eval/MatchingAlgorithmEvaluation.js";
import {Logger} from "./util/Logger.js";
import {XccAdapter} from "./test/diff_adapters/XccAdapter.js";
import {DeltaJsAdapter} from "./test/diff_adapters/DeltaJsAdapter.js";
import {DiffXmlAdapter} from "./test/diff_adapters/DiffXmlAdapter.js";
import {XmlDiffAdapter} from "./test/diff_adapters/XmlDiffAdapter.js";
import {GeneratedDiffEvaluation} from "./test/eval/GeneratedDiffEvaluation.js";


TestConfig.EXECUTION_OPTIONS.timeout = 30*1000;
TestConfig.RUN_AUTOGENERATED_TESTS = true;
Logger.enableLogging();

//new DiffAlgorithmEvaluation([new CpeeDiffLocalAdapter()]).evalAll();
GeneratedDiffEvaluation.all().flatSingle();

//DiffAlgorithmEvaluation.all().evalAll();

//MergeAlgorithmEvaluation.all().evalAll();

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

const delta = new CpeeDiff().diff(r,s);

console.log(new DeltaTreeGenerator().deltaTree(r, delta).deepEquals(s));

 */