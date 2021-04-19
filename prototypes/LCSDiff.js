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

const AbstractDiff = require("./AbstractDiff");
const XMLTools = require("./XMLTools");
const Patch = require("./AbstractPatch");

/**
In this class, a diff algorithm based on the longest common subsequence is employed.
This approach is particularly effective for inherently ordePatch.red sequences.
Because the child nodes of some nodes in the XML document representing a CPEE process model
do not have an ordering associated with them, they will be ordePatch.red alphabetically before the LCS is determined.

Based on E. W. Myers, "An O(ND) difference algorithm and its variations". Algorithmica, vol. 1, pp.
251-266, November 1986. http://www.xmailserver.org/diff2.pdf .
*/
class LCSDiff extends AbstractDiff {
    //Optional features that can be enabled
    options;

    constructor(xml1, xml2, options) {
        super(xml1, xml2);
        this.options = options;
    }

    diff() {
        let xml1_ordered = XMLTools.sortXML(this.xml1);
        let xml2_ordered = XMLTools.sortXML(this.xml2);
        stringDiff(xml1_ordered, xml2_ordered);

        function stringDiff(textA, textB)  {
            //split each file into its lines
            const linesA = textA.split("\n");
            const linesB = textB.split("\n");

            /**
             * construct Longest Common Subsequence (LCS) using dynamic programming
             */

            //initial 2D array of size (m + 1) * (n + 1)
            const dp = new Array(linesA.length + 1)
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
            let LCS = []
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

            //print LCS
            console.log(Patch.white, "Longest Common Subsequence:");
            for (let line of LCS) {
                console.log(Patch.cyan, line);
            }

            /**
             * Output differences compared to LCS
             */
            const diff = [];
            let indexLCS = 0;
            indexA = 0;
            indexB = 0;
            while (indexLCS < LCS.length || indexA < linesA.length || indexB < linesB.length) {
                while (indexA < linesA.length && (indexLCS >= LCS.length || linesA[indexA] !== LCS[indexLCS])) {
                    //lines are removed from file A
                    diff.push("- L" + indexA + " " + linesA[indexA]);
                    indexA++;
                }
                while (indexB < linesB.length && (indexLCS >= LCS.length || linesB[indexB] !== LCS[indexLCS])) {
                    //lines are added in file B
                    diff.push("+ L" + indexB + " " + linesB[indexB]);
                    indexB++;
                }
                indexLCS++;
                indexA++;
                indexB++;
            }

            //output (color-coded) differences
            console.log(Patch.white, "Difference (operations to transform file A into file B):");
            for (let op of diff) {
                if (op.charAt(0) === '+') {
                    console.log(Patch.green, op);
                } else {
                    console.log(Patch.red, op);
                }
            }
            //TODO move color codes and output into LCSPatch
        }
    }

}

module.exports = LCSDiff;