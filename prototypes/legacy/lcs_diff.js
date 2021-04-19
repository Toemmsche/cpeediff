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
 * Simple command line tool to diff two files line by line.
 * The output is given as an ordered list of add/remove operations that transform file A into file B.
 *
 * Based on E. W. Myers, "An O(ND) difference algorithm and its variations". Algorithmica, vol. 1, pp.
 * 251-266, November 1986. http://www.xmailserver.org/diff2.pdf .
 */

//Node modules
const fs = require("fs");

//Magic strings for colored console/terminal output
const green = "\x1b[32m";
const red = "\x1b[31m";
const cyan = "\x1b[36m";
const white = "\x1b[37m";

//skip first two arguments (/path/to/node /path/to/*.js file1 file2)
const args = process.argv.slice(2);

//Error handling
if (args.length < 2) {
    console.log(red, "Insufficient arguments. Please supply two valid file paths.");
    process.exit(0);
} else if (!fs.existsSync(args[0])) {
    console.log(red, "Invalid file path: " + args[0]);
    process.exit(0);
} else if (!fs.existsSync(args[1])) {
    console.log(red, "Invalid file path: " + args[1]);
    process.exit(0);
}

diff_legacy(fs.readFileSync(args[2]), fs.readFileSync(args[3]));

function diff_legacy(textA, textB) {
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
            //prepending instead of appending preserves order consistency
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
    console.log(white, "Longest Common Subsequence:");
    for (let line of LCS) {
        console.log(cyan, line);
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
    console.log(white, "Difference (operations to transform file A into file B):");
    for (let op of diff) {
        if (op.charAt(0) === '+') {
            console.log(green, op);
        } else {
            console.log(red, op);
        }
    }
}

module.exports = diff_legacy;



