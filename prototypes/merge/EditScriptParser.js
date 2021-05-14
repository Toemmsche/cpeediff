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
const {CPEENode} = require("../CPEE/CPEENode");
const {UnifiedChange} = require("../editscript/EditScript");

class EditScriptParser {

   static parseFromFile(path) {
        if(!fs.existsSync(path)) {
            throw new Error("File " + path + " does not exist");
        }
        const changes =[];

        function reviver(key, value) {
            if (key === "sourcePayload" || key === "targetPayload") return CPEENode.parseFromJSON(value);
            else return value;
        }
        for(const change of JSON.parse(fs.readFileSync(path).toString(), reviver)) {
            changes.push(Object.assign(new UnifiedChange, change));
        }

        return changes;
    }
}

exports.EditScriptParser = EditScriptParser;
