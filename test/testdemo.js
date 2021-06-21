const {StandardComparator} = require("../prototypes/compare/StandardComparator");
const {ChawatheMatching} = require("../prototypes/matching/ChawatheMatch");
const {MatchingAlgorithmEvaluation} = require("./MatchingAlgorithmEvaluation");

new MatchingAlgorithmEvaluation(new ChawatheMatching(), new StandardComparator()).runAll();