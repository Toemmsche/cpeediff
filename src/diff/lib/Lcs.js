import {DiffConfig} from '../../config/DiffConfig.js';

/**
 * Compute the length of the longest common subsequence (LCS) between two
 * sequences. A simple dynamic programming approach is employed, which yields
 * O(n*m) time complexity and O(n*m) space complexity.
 * @param {Array<any>} seqA The first sequence.
 * @param {Array<any>} seqB The second sequence.
 * @param {Function} compare The comparator function used to identify equal
 *     elements between the sequences. Defaults to the built-in strict equality
 *     operator ("===").
 * @return {Number} The length of the LCS.
 */
export function getLcsLength(seqA, seqB, compare = (a, b) => a === b) {
  // Initial 2D array of size (m + 1) * (n + 1)
  const dp = new Array(seqA.length + 1);
  for (let i = 0; i < seqA.length + 1; i++) {
    dp[i] = new Array(seqB.length + 1);
  }

  // The LCS of any sequence with a sequence of length zero
  // also has length zero
  for (let i = 0; i <= seqA.length; i++) {
    dp[i][0] = 0;
  }
  for (let i = 0; i <= seqB.length; i++) {
    dp[0][i] = 0;
  }

  // We expect most inputs to yield a short LCS, so a bottom-up approach is
  // preferred.
  for (let i = 1; i <= seqA.length; i++) {
    for (let j = 1; j <= seqB.length; j++) {
      if (compare(seqA[i - 1], seqB[j - 1])) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else if (dp[i - 1][j] > dp[i][j - 1]) {
        dp[i][j] = dp[i - 1][j];
      } else {
        dp[i][j] = dp[i][j - 1];
      }
    }
  }

  return dp[seqA.length][seqB.length];
}

// Initial 2D array of size (r + 1) * (r + 1)
const dp = new Array(DiffConfig.COMPARATOR.PATH_COMPARE_RANGE + 1);
for (let i = 0; i < dp.length; i++) {
  dp[i] = new Array(dp.length);
}

/**
 * Faster LCS computation for sequences of maximum length r (path compare
 * range) due to matrix reuse.
 * @param {Array<Number>} seqA The first sequence.
 * @param {Array<Number>} seqB The second sequence.
 * @return {Number} The length of the LCS.
 */
export function getLcsLengthFast(seqA, seqB) {
  // The LCS of any sequence with a sequence of length zero
  // also has length zero
  for (let i = 0; i <= seqA.length; i++) {
    dp[i][0] = 0;
  }
  for (let i = 0; i <= seqB.length; i++) {
    dp[0][i] = 0;
  }

  // We expect most inputs to yield a short LCS, so a bottom-up approach is
  // preferred.
  for (let i = 1; i <= seqA.length; i++) {
    for (let j = 1; j <= seqB.length; j++) {
      if (seqA[i - 1] === seqB[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else if (dp[i - 1][j] > dp[i][j - 1]) {
        dp[i][j] = dp[i - 1][j];
      } else {
        dp[i][j] = dp[i][j - 1];
      }
    }
  }

  return dp[seqA.length][seqB.length];
}

