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

const {AbstractDiff} = require("../AbstractDiff");
const {LCSDiff} = require("./LCSDiff");
const {XMLTools} = require("../XMLTools");
const {LCSPatch, LCSLine} = require("../LCSPatch");

/**
 This class features a greedy, polynomial time approximation algorithm for the minimum edit distance between two
 sequences including move operations.

 Based on Shapira, Dana and Storer, James A. "Edit distance with move operations". Journal of Discrete Algorithms 5, pp.
 380-392, May 2006.
 */
class EDMDiff extends AbstractDiff {

    /**
     * Instantiate an EDMDiff object with the given models and options.
     * @param {String} xml1 The original cpee process model as an XML document
     * @param {String} xml2 The changed cpee process model as an XML document
     * @param {String[]} options Additional options for the difference calculation
     */
    constructor(xml1, xml2, options) {
        super(xml1, xml2, options);
        this.AVAILABLE_OPTIONS = {
            ORDER: "order"
        }
    }

    diff() {
        /*
         * 1st Stage:   Repeated replacement of the longest common substring (LCStr) with a new character.
         *              Instead of characters, we consider lines of the sorted XML document representing
         *              a cpee process model.
         */

        //only order when "order" option is selected
        const xml1_ordered = this.options.includes(this.AVAILABLE_OPTIONS.ORDER) ?
            XMLTools.sortXML(this.xml1) : this.xml1;
        const xml2_ordered = this.options.includes(this.AVAILABLE_OPTIONS.ORDER) ?
            XMLTools.sortXML(this.xml2) : this.xml2;

        //split each file into its lines
        const linesA = xml1_ordered.split("\n");
        const linesB = xml2_ordered.split("\n");

        /**
         * Stores replacements for common substrings. E.g. The lines
         * "<param>\n"
         * "asdf\n"
         * "</param>\n"
         * are described by a unique identifier, e.g. "LCStr:0000"
         * if they appear in both linesA and linesB.
         * @type {Map<String, String[]>}
         */
        const lineMap = new Map();
        /**
         * Counts the number of replacements that already occured.
         * @type {number}
         */
        let replacementCounter = 0;
        /**
         * Stores the length of the (remaining) longest common substring (using lines instead of characters).
         * @type {Number}
         */
        let z = 0;
        /**
         * Stores the start index of the LCStr in linesA.
         * @type {Number}
         */
        let lcstrStartA = undefined;
        /**
         * Stores the start index of the LCStr in linesB.
         * @type {Number}
         */
        let lcstrStartB = undefined;
        do {
            //check LCStr length to avoid replacements at the beginning of the loop
            if (z > 0) {
                //store lcstr
                let lcstr = linesA.slice(lcstrStartA, lcstrStartA + z);
                let key = "LCStr" + replacementCounter++;
                lineMap.set(key, lcstr);

                //replace first occurence of lcstr in linesA and linesB
                linesA.splice(lcstrStartA + 1, z - 1);
                linesB.splice(lcstrStartB + 1, z - 1)
                linesA[lcstrStartA] = key;
                linesB[lcstrStartB] = key;
            }

            //Polynomial time solution for the LCStr problem using Dynamic Programming.
            //Adapted from https://en.wikipedia.org/wiki/Longest_common_substring_problem).
            /**
             * L[i][j] stores the length of the longest common substring ending in i and j respectively.
             * @type {Number[][]}
             */
            const L = new Array(linesA.length);
            //reset variables
            z = 0;
            lcstrStartA = undefined;
            lcstrStartA = undefined;
            for (let i = 0; i < linesA.length; i++) {
                L[i] = new Array(linesB.length);
            }
            for (let i = 0; i < linesA.length; i++) {
                for (let j = 0; j < linesB.length; j++) {
                    //compare lines instead of characters
                    if (linesA[i] === linesB[j]) {
                        if (i === 0 || j === 0) {
                            L[i][j] = 1;
                        } else {
                            //Continue the last substring
                            L[i][j] = L[i - 1][j - 1] + 1;
                        }
                        //update result
                        if (z < L[i][j]) {
                            z = L[i][j];
                            lcstrStartA = i - z + 1;
                            lcstrStartB = j - z + 1;
                        } else if (L[i][j] === z) {
                            //another substr found, we ignore it for now
                        }
                    } else {
                        L[i][j] = 0;
                    }
                }
            }
        } while (z > 1);

        /*
         * Stage 2:     Find edit distance between the modified line Arrays using the longest common subsequence algorithm.
         *              For this, our previous implementation will be employed.
         */

        const patch = new LCSDiff(linesA.join("\n"), linesB.join("\n")).diff();

        /*
         * Stage 3:     Based on the patch from LCSDiff, find lines that are both deleted and inserted.
         *              These correspond to move operations.
         */


        for (let i = 0; i < patch.lines.length; i++) {
            const lcsLine = patch.lines[i];
            for (let j = 0; j < patch.lines.length; j++) {
                const lcsLine2 = patch.lines[j];
                if (lcsLine.content === lcsLine2.content &&
                    ((lcsLine.type === LCSLine.TypeEnum.INSERTION && lcsLine2.type === LCSLine.TypeEnum.DELETION) ||
                    (lcsLine2.type === LCSLine.TypeEnum.INSERTION && lcsLine.type === LCSLine.TypeEnum.DELETION) )){
                    //move operation found
                    if(lcsLine.type === LCSLine.TypeEnum.INSERTION) {
                        patch.lines[i].content = "MOVE " + lcsLine.content;
                        patch.lines.splice(j, 1);
                        j--;

                    } else {
                        patch.lines[j].content = "MOVE " + lcsLine.content;
                        patch.lines.splice(i, 1);
                        i--;
                    }
                }
            }
        }
        for (let i = 0; i < patch.lines.length; i++) {
            if(patch.lines[i].content.startsWith("LCStr")) {
                patch.lines[i].content = lineMap.get(patch.lines[i].content).join("\n");
            }
        }
        return patch;
    }
}

exports.EDMDiff = EDMDiff;