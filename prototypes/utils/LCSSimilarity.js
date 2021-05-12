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
 * Measure the similarity between to sequences using the Longest Common Subsequence (LCS)
 */
class LCSSimilarity {

    /**
     * Usees the built-in comparator ("===")
     * @param seqA
     * @param seqB
     */
    static getLCS(seqA, seqB) {
        //initial 2D array of size (m + 1) * (n + 1)
        const dp = new Array(seqA.length + 1);
        for (let i = 0; i < seqA.length + 1; i++) {
            dp[i] = new Array(seqB.length + 1);
        }

        //the LCS of any sequence with a sequence of length zero also has length zero
        for (let i = 0; i < seqA.length + 1; i++) {
            dp[i][0] = 0;
        }
        for (let i = 0; i < seqB.length + 1; i++) {
            dp[0][i] = 0;
        }

        //fills the cell dp[indexA][indexB] with the length of the longest subsequence
        //between the subsequences of length i and j respectively
        function dp_fill(i, j) {
            //result may have been computed already
            if (dp[i][j] === undefined) {
                //dp matrix size is larger by one
                if (seqA[i - 1] === seqB[j - 1]) {
                    dp[i][j] = dp_fill(i - 1, j - 1) + 1;
                } else {
                    dp[i][j] = Math.max(dp_fill(i - 1, j), dp_fill(i, j - 1));
                }
            }
            return dp[i][j];
        }

        //Utilizing a top-down approach can save computation cost
        dp_fill(seqA.length, seqB.length);

        //the dp array only gives the length of the LCS, we still need to compute the actual sequence
        let indexA = seqA.length;
        let indexB = seqB.length;
        const LCS = []
        while (indexA > 0 && indexB > 0) {
            //if we took a diagonal step in the dp array, this item is part of the LCS
            if (dp[indexA - 1][indexB - 1] !== undefined && dp[indexA][indexB] === dp[indexA - 1][indexB - 1] + 1) {
                //prepending instead of appending preserves sorting order
                LCS.unshift(seqA[indexA - 1]);
                indexA--;
                indexB--;
            } else if (dp[indexA - 1][indexB] !== undefined && dp[indexA][indexB] === dp[indexA - 1][indexB]) {
                indexA--;
            } else {
                indexB--;
            }
        }
        return LCS;
    }

}

exports.LCSSimilarity = LCSSimilarity;