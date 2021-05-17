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

const fs = require("fs");
const {MatchDiff} = require("../diffs/MatchDiff");

class Merger {

    static merge(modelA, modelB) {
        //arbitrarily choose modelA as "old" model and modelB as "new" model to comppute edit script
        const md = new MatchDiff(modelA, modelB);
        const editScript = md.diff();

        console.log("hello");
    }
}

exports.Merger = Merger;
