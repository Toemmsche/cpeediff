/**
 * Compute the length of the LCS between two sequences
 * A simple dynamic programming approach is employed, which yields O(N*D) time
 * complexity and O(n*m) space complexity.
 * @param {Array<any>} seqA The first sequence.
 * @param {Array<any>} seqB The second sequence.
 * @param {Function} compare The comparator function used to identify equal
 *     elements between the sequences. Defaults to the built-in strict equality
 *     operator ("===").
 * @return {Number} The length of the LCS.
 */
export function getLcs(seqA, seqB, compare = (a, b) => a === b) {
  // Initial 2D array of size (m + 1) * (n + 1)
  const dp = new Array(seqA.length + 1);
  for (let i = 0; i < seqA.length + 1; i++) {
    dp[i] = new Array(seqB.length + 1);
  }

  // The LCS of any sequence with a sequence of length zero
  // also has length zero
  for (let i = 0; i < seqA.length + 1; i++) {
    dp[i][0] = 0;
  }
  for (let i = 0; i < seqB.length + 1; i++) {
    dp[0][i] = 0;
  }

  const parent = new Map();

  /**
   * Get the length of the LCS between the subsequences
   * of length i and j of seqA and seqB respectively. If this value was not
   * computed yet, calculate it based on known values.
   * @param {Number} i
   * @param  {Number} j
   * @return {Number} The value of dp[i][j]
   */
  function getLcsLen(i, j) {
    // Result may have been computed already
    if (dp[i][j] === undefined) {
      // dp matrix size is larger by one
      if (compare(seqA[i - 1], seqB[j - 1])) {
        dp[i][j] = getLcsLen(i - 1, j - 1) + 1;
      } else if (getLcsLen(i - 1, j) > getLcsLen(i, j - 1)) {
        dp[i][j] = dp[i - 1][j];
        parent.set(i + '_' + j, 'U');
      } else {
        dp[i][j] = dp[i][j - 1];
        parent.set(i + '_' + j, 'L');
      }
    }
    return dp[i][j];
  }

  // Utilizing a top-down approach can save computation cost
  return getLcsLen(seqA.length, seqB.length);
}
