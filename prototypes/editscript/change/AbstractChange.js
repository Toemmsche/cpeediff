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

const {CPEENode} = require("../../CPEE/CPEENode");

/**
 * @abstract
 */
class AbstractChange {

    targetPath;

    constructor(targetNode) {
        if(this.constructor === AbstractChange) {
            throw new Error("Cannot instantiate abstract class AbstractChange");
        }
        this.targetPath= targetNode.toString(CPEENode.STRING_OPTIONS.PATH_WITH_TYPE_INDEX);
    }

    toString(stringOption = CPEENode.STRING_OPTIONS.PATH_WITH_TYPE_INDEX){}
}

exports.AbstractChange = AbstractChange;