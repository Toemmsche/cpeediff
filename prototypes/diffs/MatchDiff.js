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

const {Matching} = require("../matchings/Matching");
const {CPEENode} = require("../CPEE/CPEENode");
const {AbstractDiff} = require("./AbstractDiff");
const {CPEEModel} = require("../CPEE/CPEEModel");
const {EditScriptGenerator} = require("../editscript/EditScriptGenerator");

class MatchDiff extends AbstractDiff {

    matchingAlgorithms;

    constructor(oldModel, newModel, ...matchingAlgorithms) {
        super(oldModel, newModel);
        this.matchingAlgorithms = matchingAlgorithms;
    }

    diff() {
        let m = new Matching();
        for(const matchingAlgorithm of this.matchingAlgorithms) {
            m = matchingAlgorithm.match(this.oldModel, this.newModel, m);
        }
        //generate edit script
        return EditScriptGenerator.generateEditScript(this.oldModel, this.newModel, m);
    }
}

exports.MatchDiff = MatchDiff;