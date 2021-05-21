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

const {TopDownMatching} = require("../matchings/TopDownMatching");
const {KyongHoMatching} = require("../matchings/KyongHoMatching");
const {Matching} = require("../matchings/Matching");
const {AbstractDiff} = require("./AbstractDiff");
const {EditScriptGenerator} = require("../editscript/EditScriptGenerator");

class MatchDiff extends AbstractDiff {

    static diff(oldModel, newModel, ...matchingAlgorithms) {
        let m = new Matching();
        for(const matchingAlgorithm of matchingAlgorithms) {
            m = matchingAlgorithm.match(oldModel, newModel, m);
        }
        //generate edit script
        return EditScriptGenerator.generateEditScript(oldModel, newModel, m);
    }
}

exports.MatchDiff = MatchDiff;