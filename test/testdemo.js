const {XmlDiffAdapter} = require("./diffeval/XmlDiffAdapter");
const {_3dmMergeAdapter} = require("./mergeeval/_3dmMergeAdapter");
const {OurMergeAdapter} = require("./mergeeval/OurMergeAdapter");
const {MergeAlgorithmEvaluation} = require("./mergeeval/MergeAlgorithmEvaluation");
const {OurDiffAdapter} = require("./diffeval/OurDiffAdapter");
const {DiffAlgorithmEvaluation} = require("./diffeval/DiffAlgorithmEvaluation");
const {OurMatchAdapter} = require("./matcheval/OurMatchAdapter");

const {MatchingAlgorithmEvaluation} = require("./matcheval/MatchingAlgorithmEvaluation");

new MatchingAlgorithmEvaluation([new OurMatchAdapter()]).evalAll();

//new DiffAlgorithmEvaluation([new OurDiffAdapter(), new XmlDiffAdapter()]).evalAll();

//new MergeAlgorithmEvaluation([new OurMergeAdapter(), new _3dmMergeAdapter()]).evalAll();