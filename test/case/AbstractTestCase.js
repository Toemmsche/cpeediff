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

/**
 * Abstract superclass for all test cases.
 * @property {String} name The name of this test case
 * @property {AbstractExpected} expected The expected result for this test case
 */
export class AbstractTestCase {

  name;
  expected;

  /**
   * Create a new test case
   * @param {String} name The name of this test case
   * @param {AbstractExpected} expected The expected result for this test case
   */
  constructor(name, expected) {
    this.name = name;
    this.expected = expected;
  }

  /**
   * Construct a test case from a test case directory.
   * @param {String} testCaseDir An absolute or relative path to the directory containing the files
   * that define the test case.
   * @return AbstractTestCase The constructed test case
   */
  static from(testCaseDir) {
    return null;
  }
}


