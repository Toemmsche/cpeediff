/*
    Copyright 2021 Tom Papke

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

import {TestConfig} from "../TestConfig.js";

import {Logger} from "../../util/Logger.js";
import {GeneratorParameters} from "../gen/GeneratorParameters.js";
import {TreeGenerator} from "../gen/TreeGenerator.js";
import {ChangeParameters} from "../gen/ChangeParameters.js";
import {AbstractEvaluation} from "./AbstractEvaluation.js";
import {MatchPipeline} from "../../src/match/MatchPipeline.js";

export class GeneratedMatchEvaluation extends AbstractEvaluation {


    //TODO init with default value
    constructor(adapters = []) {
        super(adapters);
    }

    static all() {
        let adapters = [MatchPipeline.standard(), MatchPipeline.quality(), MatchPipeline.best()];
        return new GeneratedMatchEvaluation(adapters);
    }

    evalAll() {
        Logger.info("Evaluating matching algorithms with generated process trees", this);

        //Simply run all functions...
        this.standardSingle();
        this.standardAggregate();
    }

    standardSingle() {
        Logger.info("Evaluation of matching algorithms with standard size progression", this);
        for (let i = 0; i <= TestConfig.GEN.EXP_LIMIT; i++) {
            const size = TestConfig.GEN.INITIAL_SIZE * Math.pow(TestConfig.GEN.FACTOR, i);

            //choose sensible generator and change parameters
            const genParams = new GeneratorParameters(size, size, Math.ceil(Math.log2(size)), Math.ceil(Math.log10(size)));
            const changeParams = new ChangeParameters(TestConfig.GEN.INITIAL_CHANGES * Math.pow(TestConfig.GEN.FACTOR, i));

            const testId = [size, changeParams.totalChanges].join("_");

            const treeGen = new TreeGenerator(genParams);
            const oldTree = treeGen.randomTree();
            const changedInfo = treeGen.changeTree(oldTree, changeParams);

            const newTree = changedInfo.testCase.newTree;
            const expectedMatching = changedInfo.matching;

            //Run test case for each matching pipeline and compute number of mismatched nodes
            for (const adapter of this.adapters) {
                Logger.info("Running case " + testId + " for ṕipeline", this);
                const time = new Date().getTime();
                const actualMatching = adapter.execute(oldTree, newTree);
                Logger.debug("elapsed " + (new Date().getTime() - time) + "ms", this);
                const misMatches = this._getMismatchedNodes(expectedMatching, actualMatching);
                Logger.result(  misMatches[0] + " " + (misMatches[0] / newTree.leaves().length).toFixed(2) + " " + misMatches[1] + " " + (misMatches[1] / newTree.innerNodes().length).toFixed(2) + " total: " + actualMatching.size(), this);
            }
            Logger.result("-----------------------------")
        }
    }

    _getMismatchedNodes(expected, actual) {
        let [mismatchedInners, mismatchedLeaves] = [0, 0];

        for (const [newNode, oldNode] of expected.newToOldMap) {
            if (actual.hasNew(newNode) && actual.getNew(newNode) !== oldNode) {
                const actualMatch = actual.getNew(newNode);
                const actualNewMatch = actual.getOld(oldNode);
                if (newNode.isInnerNode()) {
                    //Logger.debug("Mismatched " + newNode.label, this)
                    mismatchedInners++;
                } else if (newNode.isLeaf()) {
                    //Logger.debug("Mismatched " + newNode.label, this)
                    mismatchedLeaves++;
                }
            }
        }

        return [mismatchedLeaves, mismatchedInners];

    }
}

