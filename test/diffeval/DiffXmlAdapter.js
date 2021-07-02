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
import fs from "fs";
import {AbstractDiffAdapter} from "./AbstractDiffAdapter.js";
import {XmlFactory} from "../../src/factory/XmlFactory.js";
import {execFileSync} from "child_process";

export class DiffXmlAdapter extends AbstractDiffAdapter {

    constructor() {
        super(TestConfig.DIFFS.DIFFXML.path, TestConfig.DIFFS.DIFFXML.displayName);
    }

    _run(oldTree, newTree) {
        const oldTreeString = XmlFactory.serialize(oldTree);
        const newTreeString = XmlFactory.serialize(newTree);

        const oldFilePath = this.pathPrefix + "/old.xml";
        const newFilePath = this.pathPrefix + "/new.xml";

        fs.writeFileSync(oldFilePath, oldTreeString);
        fs.writeFileSync(newFilePath, newTreeString);

        let output;
        let time = new Date().getTime();
        try {
            output = execFileSync(this.pathPrefix + "/run.sh", [oldFilePath, newFilePath], {timeout: TestConfig.EXECUTION_TIMEOUT}).toString();
        } catch (e) {
            //for some reason, diffxml always returns raises an error even if the execution finished normally
            if(e.code !== "ETIMEDOUT" && e.output != null && e.output !== "") {
                output = e.output.toString();
            } else {
                return e;
            }

        }
        time = new Date().getTime() - time;

        return {
            runtime: time,
            output: output
        }
    }


    static register(diffAdapters) {
        if(fs.existsSync(TestConfig.DIFFS.DIFFXML.path + "/run.sh")) {
            diffAdapters.push(new DiffXmlAdapter());
        }
    }
}


