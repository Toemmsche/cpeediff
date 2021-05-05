/*
    Copyright 2021 Tom Papke

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http=//www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

const {CPEENode} = require("../CPEENode");
const {DSL} = require("../DSL");

class Call extends CPEENode {

    childAttributes;

    constructor(parent = null, childIndex = -1) {
        super(DSL.CALL, parent, childIndex);
    }

    nodeEquals(other) {
        if(!super.nodeEquals(other)) return false;
        if(this.childAttributes.size !== other.childAttributes.size) return false;
        for(const [key, value] of this.childAttributes) {
            //value is a CPEENode
            if(value.data !== other.childAttributes.get(key).data) {
               return false;
            }
        }
        return true;
    }

    compareTo(other) {
        //we cannot possibly match a call with an inner node
        if (this.label !== other.label) return 1.0;
        let differentCounter = 0;
        let total = Math.max(this.attributes.size + this.childAttributes.size, other.attributes.size + other.attributes.size);
        for(const [key, value] of this.attributes) {
            //only count real differences, not pure insertions/deletions
            if(other.attributes.has(key) && value !== other.attributes.get(key)) {
                differentCounter++;
            }
        }
        for(const [key, value] of this.childAttributes) {
            //value is a CPEENode
            if(other.childAttributes.has(key) && value.data !== other.childAttributes.get(key).data) {
                differentCounter++;
            }
        }
        return differentCounter / total;
    }


}

exports.Call = Call;