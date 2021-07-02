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

import {execSync} from "child_process";
import {XmlFactory} from "../../src/factory/XmlFactory.js";
import {TestConfig} from "../TestConfig.js";
import fs from "fs";
import {MergeTestResult} from "./MergeTestResult.js";

export class _3dmMergeAdapter {

    evalCase(name, base, branch1, branch2, expected, accepted) {

        const pathPrefix = TestConfig.MERGES._3DM.path;
        const displayName = TestConfig.MERGES._3DM.displayName

        const baseString = XmlFactory.serialize(base);
        const branch1String = XmlFactory.serialize(branch1);
        const branch2String = XmlFactory.serialize(branch2);

        const baseFilePath = pathPrefix + "/base.xml";
        const branch1Filepath = pathPrefix + "/1.xml";
        const branch2FilePath = pathPrefix + "/2.xml";

        fs.writeFileSync(baseFilePath, baseString);
        fs.writeFileSync(branch1Filepath, branch1String);
        fs.writeFileSync(branch2FilePath, branch2String);

        let verdict = TestConfig.VERDICTS.OK;
        //TODO prettier
        let mergedXml;
        try {
            mergedXml = execSync(pathPrefix + "/run.sh " + baseFilePath + " " + branch1Filepath + " " + branch2FilePath).toString();
        } catch (e) {
            //something went wrong...
            verdict = TestConfig.VERDICTS.RUNTIME_ERROR;
        }
        if (verdict === TestConfig.VERDICTS.OK) {
            const actual = new Preprocessor().parseWithMetadata(mergedXml);
            verdict = this._verifyResult(actual, expected, accepted);
        }
        return new MergeTestResult(name, displayName, verdict);
    }

    _verifyResult(actual, expected, accepted) {
        if (expected.some(t => t.deepEquals(actual))) {
            return TestConfig.VERDICTS.OK;
        } else if (accepted.some(t => t.deepEquals(actual))) {
            return TestConfig.VERDICTS.ACCEPTABLE;
        } else {
            return TestConfig.VERDICTS.WRONG_ANSWER;
        }
    }
}


