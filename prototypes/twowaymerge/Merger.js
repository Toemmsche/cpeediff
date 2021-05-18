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
const {Reshuffle} = require("../editscript/change/Reshuffle");
const {Update} = require("../editscript/change/Update");
const {Move} = require("../editscript/change/Move");
const {Insertion} = require("../editscript/change/Insertion");
const {Deletion} = require("../editscript/change/Deletion");
const {CPEEModel} = require("../CPEE/CPEEModel");
const {MatchDiff} = require("../diffs/MatchDiff");

class Merger {

    static merge(baseModel, modelA, modelB) {
        const json = baseModel.root.convertToJSON();
        //arbitrarily choose modelA as "old" model and modelB as "new" model to comppute edit script
        let md = new MatchDiff(baseModel, modelA);
        const editScriptA = md.diff();

        baseModel = new CPEEModel(CPEEModel.parseFromJSON(json));
         md = new MatchDiff(baseModel, modelB);
        const editScriptB = md.diff();

        let i = 0;
        let j = 0;
        while( i < editScriptA.changes.length && j < editScriptB.changes.length) {
            const change = editScriptB.changes[j];

           switch(change.constructor) {
               case Deletion: {

               }
               case Insertion:
               case Move:
               case Update:
               case Reshuffle:
           }
            console.log("hello");
        }

    }
}

exports.Merger = Merger;
