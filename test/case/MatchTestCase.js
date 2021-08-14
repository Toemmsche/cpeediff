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
import {TestConfig} from "../TestConfig.js";
import {MatchTestResult} from "../result/MatchTestResult.js";
import fs from "fs";
import {ExpectedMatch} from "../expected/ExpectedMatch.js";
import {Preprocessor} from "../../src/io/Preprocessor.js";

/**
 * Represents a test case for the evaluation of matching algorithms.
 * @property {String} name The name of the test case
 * @property {Node} oldTree The root of the original process tree
 * @property {Node} newTree The root of the changed process tree
 * @property {ExpectedMatch} expected Rules for the expected matching
 * @extends AbstractTestCase
 */
export class MatchTestCase extends AbstractTestCase {

    oldTree;
    newTree;


    /**
     * Construct a new match test case
     * @param {String} name The name of this test case
     * @param {Node} oldTree The root of the original process tree
     * @param {Node} newTree The root of the changed process tree
     * @param {ExpectedMatch} expected Rules for the expected matching
     */
    constructor(name, oldTree, newTree, expected) {
        super(name, expected);
        this.oldTree = oldTree;
        this.newTree = newTree;
    }

    /**
     * Construct a match test case from a test case directory.
     * @param {String} testCaseDir An absolute or relative path to the test case directory
     * @return MatchTestCase The constructed match test case
     */
    static from(testCaseDir) {
        const testCaseName = testCaseDir.split("/").pop();

        const parser = new Preprocessor();
        let oldTree, newTree, expected;
        fs.readdirSync(testCaseDir).forEach((file) => {
                const content = fs.readFileSync(testCaseDir + "/" + file).toString();
                if (file === TestConfig.FILENAMES.NEW_TREE) {
                    newTree = parser.parseWithMetadata(content);
                } else if (file === TestConfig.FILENAMES.OLD_TREE) {
                    oldTree = parser.parseWithMetadata(content);
                } else if (file === TestConfig.FILENAMES.EXPECTED_MATCHES) {
                    expected = Object.assign(new ExpectedMatch(), JSON.parse(content));
                }
            }
        );
        return new MatchTestCase(testCaseName, oldTree, newTree, expected)
    }

    /**
     * Complete this test case.
     * @param {String} algorithm The algorithm that ran this case
     * @param {ActualMatching|null} actual The matching produced by the algorithm, null indicates failure
     * @param {String} verdict The verdict for this test case and algorithm
     * @return MatchTestResult The corresponding result
     */
    complete(algorithm, actual = null, verdict) {
        return new MatchTestResult(this.name, algorithm, actual, verdict);
    }
}


