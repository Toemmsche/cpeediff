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
 * Measure the similarity between to sequences using the Longest Common Subsequence (LongestCommonSubsequence)
 */
export class Lcs {

    /**
     * Uses the built-in comparator ("===")
     * @param seqA
     * @param seqB
     * @param compare
     */
    static getLCS(seqA, seqB, compare = (a, b) => a === b) {
        //initial 2D array of size (m + 1) * (n + 1)
        const dp = new Array(seqA.length + 1);
        for (let i = 0; i < seqA.length + 1; i++) {
            dp[i] = new Array(seqB.length + 1);
        }

        //the LongestCommonSubsequence of any sequence with a sequence of length zero also has length zero
        for (let i = 0; i < seqA.length + 1; i++) {
            dp[i][0] = 0;
        }
        for (let i = 0; i < seqB.length + 1; i++) {
            dp[0][i] = 0;
        }

        const parent = new Map();

        //fills the cell dp[indexA][indexB] with the length of the longest subsequence
        //between the subsequences of length i and j respectively
        function dp_fill(i, j) {
            //result may have been computed already
            if (dp[i][j] === undefined) {
                //dp matrix size is larger by one
                if (compare(seqA[i - 1], seqB[j - 1])) {
                    dp[i][j] = dp_fill(i - 1, j - 1) + 1;
                } else if (dp_fill(i - 1, j) > dp_fill(i, j - 1)) {
                    dp[i][j] = dp[i - 1][j];
                    parent.set(i + "_" + j, "U");
                } else {
                    dp[i][j] = dp[i][j - 1];
                    parent.set(i + "_" + j, "L");
                }
            }
            return dp[i][j];
        }

        //Utilizing a top-down approach can save computation cost
        dp_fill(seqA.length, seqB.length);

        //compute actual lcs using parent values
        let indexA = seqA.length;
        let indexB = seqB.length;
        let lcs;
        lcs = []
        while (indexA > 0 && indexB > 0) {
            switch (parent.get(indexA + "_" + indexB)) {
                case "U":
                    indexA--;
                    break;
                case "L":
                    indexB--;
                    break;
                default:
                    lcs.unshift(seqA[indexA - 1]);
                    indexA--;
                    indexB--;
                    break;
            }
        }
        return lcs;
    }

}