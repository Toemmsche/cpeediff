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