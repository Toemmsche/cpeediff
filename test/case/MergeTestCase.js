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
import {MergeTestResult} from "../result/MergeTestResult.js";
import fs from "fs";
import {Preprocessor} from "../../src/io/Preprocessor.js";
import {ExpectedMerge} from "../expected/ExpectedMerge.js";


/**
 * Represents a test case for the evaluation of merging algorithms.
 * @property {String} name The name of the test case
 * @property {Node} base The root of the base process tree
 * @property {Node} branch1 The root of the first branch process tree#
 * @property {Node} branch2 The root of the second branch process tree
 * @property {ExpectedMerge} expected The expected merge results
 * @extends AbstractTestCase
 */
export class MergeTestCase extends AbstractTestCase {

    base;
    branch1;
    branch2;

    /**
     * Construct a new merge test case.
     * @param {String} name The name of the test case
     * @param {Node} base The root of the base process tree
     * @param {Node} branch1 The root of the first branch process tree#
     * @param {Node} branch2 The root of the second branch process tree
     * @param {ExpectedMerge} expected The expected merge results
     */
    constructor(name, base, branch1, branch2,  expected) {
        super(name, expected);
        this.base = base;
        this.branch1 = branch1;
        this.branch2 = branch2;
    }

    /**
     * Construct a merge test case from a test case directory.
     * @param {String} testCaseDir An absolute or relative path to the test case directory
     * @return MergeTestCase The constructed merge test case
     */
    static from(testCaseDir) {
        const parser = new Preprocessor();
        const testCaseName = testCaseDir.split("/").pop();
        let base;
        let branch1;
        let branch2;
        let expected = [];
        let accepted = [];

        fs.readdirSync(testCaseDir).forEach((file) => {
                const content = fs.readFileSync(testCaseDir + "/" + file).toString();
                if (file === TestConfig.BASE_FILE_NAME) {
                    base = parser.parseWithMetadata(content);
                } else if (file === TestConfig.BRANCH_1_FILE_NAME) {
                    branch1 = parser.parseWithMetadata(content);
                } else if (file === TestConfig.BRANCH_2_FILE_NAME) {
                    branch2 = parser.parseWithMetadata(content);
                } else if (file.startsWith(TestConfig.EXPECTED_MERGE_PREFIX)) {
                    expected.push(parser.parseWithMetadata(content));
                } else if (file.startsWith(TestConfig.ACCEPTED_MERGE_PREFIX)) {
                    accepted.push(parser.parseWithMetadata(content));
                }
            }
        );
        return new MergeTestCase(testCaseName, base, branch1, branch2, new ExpectedMerge(expected, accepted));
    }

    /**
     * Complete this test case.
     * @param {String} algorithm The algorithm that ran this case
     * @param {ActualMerge|null} actual The merge produced by the algorithm, null indicates failure
     * @param {String} verdict The verdict for this test case and algorithm
     * @return MergeTestResult The corresponding result
     */
    complete(algorithm, actual = null, verdict) {
        return new MergeTestResult(this.name, algorithm, actual, verdict);
    }
}


