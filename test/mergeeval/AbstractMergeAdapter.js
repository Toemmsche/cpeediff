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

import {execFileSync} from "child_process";
import {XmlFactory} from "../../src/factory/XmlFactory.js";
import {TestConfig} from "../TestConfig.js";
import fs from "fs";
import {MergeTestResult} from "./MergeTestResult.js";
import {Preprocessor} from "../../src/parse/Preprocessor.js";

export class AbstractMergeAdapter {

    pathPrefix;
    displayName;

    constructor(pathPrefix, displayName) {
        this.pathPrefix = pathPrefix;
        this.displayName = displayName;
    }

    _run(name, base, branch1, branch2) {
        const baseString = XmlFactory.serialize(base);
        const branch1String = XmlFactory.serialize(branch1);
        const branch2String = XmlFactory.serialize(branch2);

        const baseFilePath = this.pathPrefix + "/base.xml";
        const branch1Filepath = this.pathPrefix + "/1.xml";
        const branch2FilePath = this.pathPrefix + "/2.xml";

        fs.writeFileSync(baseFilePath, baseString);
        fs.writeFileSync(branch1Filepath, branch1String);
        fs.writeFileSync(branch2FilePath, branch2String);

        //TODO prettier
        return execFileSync(this.pathPrefix + "/run.sh", [baseFilePath, branch1Filepath, branch2FilePath], TestConfig.EXECUTION_OPTIONS).toString();

    }

    evalCase(name, base, branch1, branch2, expected, accepted) {
        let exec;
        try {
            exec = this._run(name, base, branch1, branch2);
        } catch (e) {
            return new MergeTestResult(name, this.displayName, TestConfig.VERDICTS.RUNTIME_ERROR);
        }

        return new MergeTestResult(name, this.displayName, this._verifyResult(exec, expected, accepted));
    }

    _verifyResult(output, expected, accepted) {
        const actual = new Preprocessor().parseWithMetadata(output);
        //TODO disregard child order where applicable
        if (expected.some(t => t.deepEquals(actual))) {
            return TestConfig.VERDICTS.OK;
        } else if (accepted.some(t => t.deepEquals(actual))) {
            return TestConfig.VERDICTS.ACCEPTABLE;
        } else {
            return TestConfig.VERDICTS.WRONG_ANSWER;
        }
    }
}


