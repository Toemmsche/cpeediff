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

    //We detect three types of change operations applied to a model
    //Insertion of a new node
    inserts;
    //Deletion of a node
    deletes;
    //Move of a node within the tree without changing it
    moves;

    constructor(diffList) {
        if(this.constructor === AbstractPatch) {
            throw new Error("Instantiation of Abstract class 'AbstractPatch'");
        }

        this.inserts = [];
        this.deletes = [];
        this.moves = [];
    }

    /**
     * Apply the patch to a CPEE process model in XML document format.
     * @param xml
     */
    merge(xml) {}
}

module.exports = AbstractPatch;