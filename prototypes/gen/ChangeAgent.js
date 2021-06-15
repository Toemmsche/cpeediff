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

const {Dsl} = require("../Dsl");

class ChangeAgent {

    maxChanges;
    constructor(maxChanges) {
        this.maxChanges = maxChanges;
    }

    changeModel(model) {
        //do not modify original model
        model = model.copy();

        for (let i = 0; i < this.maxChanges; i++) {
            switch(this.randomFrom(Dsl.CHANGE_TYPE_SET)) {
            }
        }
    }



}

exports.ChangeAgent = ChangeAgent;