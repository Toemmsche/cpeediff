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

import {AbstractTestCase} from "./AbstractTestCase.js";
import fs from "fs";
import {TestConfig} from "../TestConfig.js";
import {ExpectedDiff} from "../expected/ExpectedDiff.js";
import {Preprocessor} from "../../src/io/Preprocessor.js";
import {GeneratorParameters} from "../gen/GeneratorParameters.js";
import {ChangeParameters} from "../gen/ChangeParameters.js";
import {TreeGenerator} from "../gen/TreeGenerator.js";
import {Logger} from "../../util/Logger.js";
import {DiffTestResult} from "../result/DiffTestResult.js";

/**
 * Represents a test case for the evaluation of diff algorithms.
 * @property {Node} oldTree The root of the original process tree
 * @property {Node} newTree The root of the changed process tree
 * @property {ExpectedDiff} expected Additional information about the test case like the maximum tree size
 * and the number and distribution of edit operations applied.
 * @extends AbstractTestCase
 */
export class DiffTestCase extends AbstractTestCase {

    oldTree;
    newTree;

    /**
     * Construct a new diff test case
     * @param {String} name The name of this test case
     * @param {Node} oldTree The root of the original process tree
     * @param {Node} newTree The root of the changed process tree
     * @param {ExpectedDiff} expected The expected edit operations to be found
     */
    constructor(name, oldTree, newTree, expected) {
        super(name, expected);
        this.oldTree = oldTree;
        this.newTree = newTree;
    }

    /**
     * Construct a diff test case from a test case directory.
     * @param {String} testCaseDir An absolute or relative path to the test case directory
     * @return DiffTestCase The constructed diff test case
     */
    static from(testCaseDir) {
        const testCaseName = testCaseDir.split("/").pop();
        let oldTree, newTree, expected;
        if (testCaseName.startsWith("gen_")) {
            //Generated test case
            if (!TestConfig.RUN_AUTOGENERATED_TESTS) {
                return null;
            }

            let genParams;
            //change parameters are optional
            let changeParams = new ChangeParameters();
            fs.readdirSync(testCaseDir).forEach((file) => {
                    const content = fs.readFileSync(testCaseDir + "/" + file).toString();
                    switch (file) {
                        case TestConfig.GEN_PARAMS_FILENAME:
                            genParams = Object.assign(new GeneratorParameters(), JSON.parse(content));
                            break;
                        case TestConfig.CHANGE_PARAMS_FILENAME:
                            changeParams = Object.assign(changeParams, JSON.parse(content));
                            break;
                    }
                }
            );
            //Generator parameters are required
            if (genParams == null) {
                return null;
            }

            const treeGen = new TreeGenerator(genParams);
            switch (testCaseName) {
                case "gen_deep_and_wide":
                    Logger.info("Generating process tree with O(n) depth and width", this);
                    oldTree = treeGen.oldDeepAndWide();
                    newTree = treeGen.newDeepAndWide();
                    break;
                case "gen_totally_different": {
                    Logger.info("Generating two unrelated process trees", this);
                    oldTree = treeGen.randomTree();
                    newTree = treeGen.randomTree();
                    break;
                }
                default: {
                    //TODO
                    oldTree = treeGen.randomTree();
                    if (testCaseName === "gen_leaves_only_shuffled") {
                        oldTree = treeGen.leavesOnly();
                    }
                    const changedInfo = treeGen.changeTree(oldTree, changeParams);
                    newTree = changedInfo.tree;
                    expected = changedInfo.expected;
                    break;
                }
            }
        } else {
            //Regular test case definition
            const parser = new Preprocessor();
            fs.readdirSync(testCaseDir).forEach((file) => {
                    const content = fs.readFileSync(testCaseDir + "/" + file).toString();
                    if (file === TestConfig.NEW_TREE_FILENAME) {
                        newTree = parser.parseWithMetadata(content);
                    } else if (file === TestConfig.OLD_TREE_FILENAME) {
                        oldTree = parser.parseWithMetadata(content);
                    } else if (file === TestConfig.DIFF_EXPECTED_FILENAME) {
                        expected = Object.assign(new ExpectedDiff(), JSON.parse(content));
                    }
                }
            );
            //The two process trees are the bare minimum needed for a test case
            if (oldTree == null || newTree == null) {
                return null;
            }
        }
        if (expected == null) {
            expected = new ExpectedDiff();
        }
        expected.maxSize = Math.max(oldTree.size(), newTree.size());
        return new DiffTestCase(testCaseName, oldTree, newTree, expected);
    }

    /**
     * Complete this test case.
     * @param {String} algorithm The algorithm that ran this case
     * @param {Number} runtime The time (in ms) the algorithm took to complete the case.
     * @param {ActualDiff|null} actual The diff produced by the algorithm, null indicates failure
     * @param {String} verdict The verdict for this test case and algorithm
     * @return DiffTestResult The corresponding result
     */
    complete(algorithm,runtime,  actual = null, verdict) {
        return new DiffTestResult(this.name, algorithm, runtime, actual, verdict);
    }

}


