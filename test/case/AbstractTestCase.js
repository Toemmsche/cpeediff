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
 */
export class AbstractTestCase {

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


