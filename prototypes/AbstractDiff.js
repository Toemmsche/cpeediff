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
 * Abstract super class for all diff algorithms.
 * @abstract
 */
class AbstractDiff {
    //The original process model in XML
    xml1;
    //The changed process model in XML
    xml2;

    /**
     * Instantiate an AbstractDiff object.
     * @param xml1 The original CPEE process model as an XML document string
     * @param xml2 The changed CPEE process model as an XML document string
     * @throws Error If not called from within a subclass
     */
    constructor(xml1, xml2) {
        if (this.constructor === AbstractDiff) {
            throw new Error("Instantiation of Abstract class 'AbstractDiff'");
        }
        this.xml1 = xml1;
        this.xml2 = xml2;
    }

    /**
     * Diffs the two CPEE process models in XML document format.
     * @return patch A list of changes, grouped by operation
     */
    diff() {}
}


module.exports = AbstractDiff;