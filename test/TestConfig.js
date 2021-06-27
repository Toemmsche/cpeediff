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

class TestConfig {

    static MATCH_CASES_DIR = "test/test_set/match_cases";
    static DIFF_CASES_DIR = "test/test_set/diff_cases";
    static MERGE_CASES_DIR = "test/test_set/merge_cases";

    static VERDICTS = {
        OK: "OK",
        ACCEPTABLE: "ACCEPTABLE",
        WRONG_ANSWER: "WRONG ANSWER",
        RUNTIME_ERROR: "RUNTIME ERROR"
    }

    static _3DM_PATH = "/home/tom/Documents/xml_diff_algos/3dm";
    static XMLDIFF_PATH = "/home/tom/Documents/xml_diff_algos/XmlDiff";
    static DIFFXML_PATH = "/home/tom/Documents/xml_diff_algos/diffxml";
    static DELTAJS_PATH = "/home/tom/Documents/xml_diff_algos/deltajs";

    //TODO criteria matching
    //     #tests passed (accuracy and overall quality)
    //      runtime
    //      edit script size
    //      #nodes matched
    //      merging #tests with expected result (conflict or no conflict)


}

exports.TestConfig = TestConfig