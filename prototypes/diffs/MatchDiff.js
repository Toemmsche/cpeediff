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

const {StandardComparator} = require("../compare/StandardComparator");
const {CpeeModel} = require("../cpee/CpeeModel");
const {Matching} = require("../matching/Matching");
const {AbstractDiff} = require("./AbstractDiff");
const {EditScriptGenerator} = require("../editscript/EditScriptGenerator");

class MatchDiff extends AbstractDiff {

    static diff(oldModel, newModel, ...matchingAlgorithms) {
        //this will modify the old model, hence a copy is used
        const copyOfOld = oldModel.copy();
        let m = new Matching();
        const start = new Date().getTime();
        for(const matchingAlgorithm of matchingAlgorithms) {
            m = matchingAlgorithm.match(copyOfOld, newModel, m, new StandardComparator(m));
        }
        const end = new Date().getTime();
        console.log("matchtook " + (end - start) + "ms");

        //generate edit script
        return new EditScriptGenerator().generateEditScript(copyOfOld, newModel, m);
    }
}

exports.MatchDiff = MatchDiff;