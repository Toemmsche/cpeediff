const {TestConfig} = require("./TestConfig");
const {OurAdapter} = require("./matcheval/OurAdapter");
const {StandardComparator} = require("../prototypes/compare/StandardComparator");
const {ChawatheMatching} = require("../prototypes/matching/ChawatheMatch");
const {MatchingAlgorithmEvaluation} = require("./matcheval/MatchingAlgorithmEvaluation");

new MatchingAlgorithmEvaluation([new OurAdapter()]).evalAll();