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

/**
 * Abstract super class for all patches.
 * @abstract
 */
class AbstractPatch {
    //Color codes for the command line
    static green = "\x1b[32m";
    static red = "\x1b[31m";
    static cyan = "\x1b[36m";
    static white = "\x1b[37m";
    static yellow = "\x1b[33m";
    static blue = "\x1b[34m";

    changes;

    constructor() {
        if(this.constructor === AbstractPatch) {
            throw new Error("Instantiation of Abstract class 'AbstractPatch'");
        }
        this.changes = [];
    }

    /**
     * Merge the changes contained in this patch with an existing process model
     * @param {CPEEModel} model A CPEE process model
     */
    merge(model) {}

    /**
     * @override
     * @return {String} Color-coded string representation of this patch
     */
    toString() {}
}

exports.AbstractPatch = AbstractPatch;