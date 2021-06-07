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

const {AbstractDiff} = require("../diffs/AbstractDiff");
const {XMLTools} = require("./XMLTools");
const {LCSPatch, LCSLine} = require("./LCSPatch");

/**
 In this class, a diff algorithm based on the longest common subsequence is employed.

 The original algorithm only considers the syntax of two files.
 We can improve it to focus on semantic differences by ordering the child nodes
 where permitted by the cpee specification (cpee.org).

 Based on E. W. Myers, "An O(ND) difference algorithm and its variations". Algorithmica, vol. 1, pp.
 251-266, November 1986. http://www.xmailserver.org/diff2.pdf .
 */
class LCSDiff extends AbstractDiff {
    /**
     * Instantiate an LCSDiff object with the given models and options.
     * @param {String} xml1 The original cpee process model as an XML document
     * @param {String} xml2 The changed cpee process model as an XML document
     * @param {[String]} options Additional options for the difference calculation
     */
    constructor(xml1, xml2, options= []) {
        super(xml1, xml2, options);
        this.AVAILABLE_OPTIONS = {
            ORDER: "order"
        }
    }

    /**
     * @override
     * @return {LCSPatch}
     */
    diff() {
        //only order when "order" option is selected
        const xml1_ordered = this.options.includes(this.AVAILABLE_OPTIONS.ORDER) ?
            XMLTools.sortXML(this.xml1) : this.xml1;
        const xml2_ordered = this.options.includes(this.AVAILABLE_OPTIONS.ORDER) ?
            XMLTools.sortXML(this.xml2) : this.xml2;

        //split each file into its lines
        const linesA = xml1_ordered.split("\n");
        const linesB = xml2_ordered.split("\n");

        /**
         * construct Longest Common Subsequence (LCS) using dynamic programming
         */

        //initial 2D array of size (m + 1) * (n + 1)
        const dp = new Array(linesA.length + 1);
        for (let i = 0; i < linesA.length + 1; i++) {
            dp[i] = new Array(linesB.length + 1);
        }

        //the LCS of any sequence with a sequence of length zero also has length zero
        for (let i = 0; i < linesA.length + 1; i++) {
            dp[i][0] = 0;
        }
        for (let i = 0; i < linesB.length + 1; i++) {
            dp[0][i] = 0;
        }

        //fills the cell dp[indexA][indexB] with the length of the longest subsequence
        //between the subsequences of length i and j respectively
        function dp_fill(i, j) {
            //result may have been computed already
            if (dp[i][j] === undefined) {
                //dp matrix size is larger by one
                if (linesA[i - 1] === linesB[j - 1]) {
                    dp[i][j] = dp_fill(i - 1, j - 1) + 1;
                } else {
                    dp[i][j] = Math.max(dp_fill(i - 1, j), dp_fill(i, j - 1));
                }
            }
            return dp[i][j];
        }

        //Utilizing a top-down approach can save computation cost
        dp_fill(linesA.length, linesB.length);

        //the dp array only gives the length of the LCS, we still need to compute the actual sequence
        let indexA = linesA.length;
        let indexB = linesB.length;
        const LCS = []
        while (indexA > 0 && indexB > 0) {
            //if we took a diagonal step in the dp array, this item is part of the LCS
            if (dp[indexA - 1][indexB - 1] !== undefined && dp[indexA][indexB] === dp[indexA - 1][indexB - 1] + 1) {
                //prepending instead of appending preserves sorting order
                LCS.unshift(linesA[indexA - 1]);
                indexA--;
                indexB--;
            } else if (dp[indexA - 1][indexB] !== undefined && dp[indexA][indexB] === dp[indexA - 1][indexB]) {
                indexA--;
            } else {
                indexB--;
            }
        }

        /**
         * Output differences compared to LCS
         */

        const patch = new LCSPatch();
        let indexLCS = 0;
        indexA = 0;
        indexB = 0;
        while (indexLCS < LCS.length || indexA < linesA.length || indexB < linesB.length) {
            while (indexA < linesA.length && (indexLCS >= LCS.length || linesA[indexA] !== LCS[indexLCS])) {
                //lines are removed from file A
                patch.lines.push(new LCSLine(LCSLine.TypeEnum.DELETION, linesA[indexA]));
                indexA++;
            }
            while (indexB < linesB.length && (indexLCS >= LCS.length || linesB[indexB] !== LCS[indexLCS])) {
                //lines are added in file B
                patch.lines.push(new LCSLine(LCSLine.TypeEnum.INSERTION, linesB[indexB]));
                indexB++;
            }
            //we also add the lcs to the patch
            patch.lines.push(new LCSLine(LCSLine.TypeEnum.LCS, LCS[indexLCS]));
            indexLCS++;
            indexA++;
            indexB++;
        }
        return patch;
    }
}

exports.LCSDiff = LCSDiff;