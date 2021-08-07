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

import {AbstractExpected} from "./AbstractExpected.js";
import {XmlFactory} from "../../src/io/XmlFactory.js";

export class ExpectedDiff extends AbstractExpected{

    maxSize;
    editScript;

    constructor( maxSize, editScript = null) {
        super();
        this.maxSize = maxSize;
        this.editScript = editScript;
    }

    toString() {
        return "Max Size of process trees: " + this.maxSize + "\n" +
            "Cost: " + this.editScript?.cost + "\n" +
            "Diff Size: " + (this.editScript != null ? XmlFactory.serialize(this.editScript).length : undefined) + "\n" +
            "Total changes: " +  + this.editScript?.totalChanges() + "\n" +
            "Insertions: " + this.editScript?.insertions() + "\n" +
            "Moves: " + this.editScript?.moves() + "\n" +
            "Updates: " + this.editScript?.updates() + "\n" +
            "Deletions: " + this.editScript?.deletions();
    }

    values() {
        return ["Expected", "-", this.editScript.cost, XmlFactory.serialize(this.editScript).length, this.editScript.totalChanges(),
            this.editScript.insertions(), this.editScript.moves(), this.editScript.updates(), this.editScript.deletions()];
    }

}


