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
import {MatchPipeline} from "../../src/match/MatchPipeline.js";
import {Config} from "../../src/Config.js";
import {markdownTable} from "markdown-table";
import {match} from "assert";

export class GeneratedMatchEvaluation {

    evalAll() {
        Logger.info("Evaluating matching algorithms with generated process trees", this);

        //Simply run all functions...
        this.standardSingle();
    }

    standardSingle() {
        Logger.info("Evaluation of matching algorithms with standard size progression", this);
        for (let i = 0; i <= TestConfig.PROGRESSION.EXP_LIMIT; i++) {
            const size = TestConfig.PROGRESSION.INITIAL_SIZE * Math.pow(TestConfig.PROGRESSION.FACTOR, i);

            //choose sensible generator and change parameters
            const genParams = new GeneratorParameters(size, size, Math.ceil(Math.log2(size)), Math.ceil(Math.log10(size)));
            const changeParams = new ChangeParameters(TestConfig.PROGRESSION.INITIAL_CHANGES * Math.pow(TestConfig.PROGRESSION.FACTOR, i));

            const testId = [size, changeParams.totalChanges].join("_");

            const treeGen = new TreeGenerator(genParams);
            let results = new Map();
            for (let j = 0; j < 20; j++) {

                const oldTree = treeGen.randomTree();
                const changedInfo = treeGen.changeTree(oldTree, changeParams);

                const newTree = changedInfo.testCase.newTree;
                const expectedMatching = changedInfo.matching;

                //Run test case for each matching pipeline and compute number of mismatched nodes
                for (const matchMode of Object.values(Config.MATCH_MODES)) {
                    Config.MATCH_MODE = matchMode;
                    if(!results.has(matchMode)) {
                        results.set(matchMode, []);
                    }
                    Logger.info("Running case " + testId + " for match mode " + matchMode, this);
                    const time = new Date().getTime();
                    const actualMatching = MatchPipeline.fromMode().execute(oldTree, newTree);
                    const elapsedTime = new Date().getTime() - time;
                    const matchingCommonality = this._matchingCommonality(expectedMatching, actualMatching);
                    results.get(matchMode).push([matchMode, elapsedTime,  matchingCommonality.toFixed(4) * 100]);
                    //Logger.result(misMatches[0] + " " + (misMatches[0] / newTree.leaves().length).toFixed(2) + " " + misMatches[1] + " " + (misMatches[1] / newTree.innerNodes().length).toFixed(2) + " total: " + actualMatching.size(), this);
                }
            }

            results = [...results.entries()].map(e => [e[0], this.avg(e[1].map(r => r[1])), this.avg(e[1].map(r => r[2]))]);
            Logger.result("Results for case " + testId, this);
            Logger.result(markdownTable([["match mode", "runtime", "overlap % with expected"],...results]));
        }
    }

    avg(arr) {
        return arr.reduce((a, b) => a + b, 0) / arr.length;
    }

    _matchingCommonality(expected, actual) {
        let common = 0;
        for (const [newNode, oldNode] of expected.newToOldMap) {
            if (actual.hasNew(newNode) && actual.getNew(newNode) === oldNode) {
                common++;
            }
        }

        return common / (Math.max(expected.size(), actual.size()));
    }


    _getMismatchedNodes(expected, actual) {
        let [mismatchedLeaves, mismatchedInners, unmatchedLeaves, unmatchedInners] = [0, 0, 0, 0];

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

