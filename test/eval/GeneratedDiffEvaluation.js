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
import * as fs from "fs";
import {MarkDownFactory} from "../../util/MarkDownFactory.js";
import {CpeeDiffAdapter} from "../diff_adapters/CpeeDiffAdapter.js";
import {XmlDiffAdapter} from "../diff_adapters/XmlDiffAdapter.js";
import {DiffXmlAdapter} from "../diff_adapters/DiffXmlAdapter.js";
import {DeltaJsAdapter} from "../diff_adapters/DeltaJsAdapter.js";
import {XccAdapter} from "../diff_adapters/XccAdapter.js";
import {UnixDiffAdapter} from "../diff_adapters/UnixDiffAdapter.js";
import {XyDiffAdapter} from "../diff_adapters/XyDiffAdapter.js";
import {Logger} from "../../util/Logger.js";
import {DirectoryScraper} from "../../util/DirectoryScraper.js";
import {DiffTestCase} from "../case/DiffTestCase.js";
import {Config} from "../../src/Config.js";
import {DiffAlgorithmEvaluation} from "./DiffAlgorithmEvaluation.js";

export class GeneratedDiffEvaluation extends DiffAlgorithmEvaluation {

    constructor(adapters = []) {
       super(adapters);
    }

    evalAll() {
        Logger.info("Evaluating diff algorithms with generated process trees", this);

        //turn off pretty print for efficiency and fairness reasons
        Config.PRETTY_XML = false;


    }
}

