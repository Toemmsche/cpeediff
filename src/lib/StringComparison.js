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
 * Compute an estimate for the comparison value of two strings using the q-gram distance.
 * @param {String} strA The first string
 * @param {String} strB The second string
 * @param {Number} q The length of a q-gram. Defaults to 2 for max length < 100, else 4
 */
export function getStringCV(strA, strB, defaultValue = null,  q = null) {
    /*
    We compute the q-gram distance as described in "Approximate string-matching with q-grams and maximal matches"
    by Esko Ukkonen, 1992. The q-gram distance is nothing but the Manhattan distance between the q-gram profiles of
    two strings A and B. The q-gram profile for a string S is constructed by counting the number of occurrences of each string
    of length q within S. This implies that every char within S is "looked at" exactly q times, yielding
    a O(n) runtime in the general case. Obviously, the q-gram profile of S can contain at most q*|S| entries with
    a count > 0. Using a hashmap to hold the counts of each q-gram for the strings A and B leads to O(n) time complexity
    for the computation of the q-gram distance between A and B. Ukkonen showed that distQram / 2q is a lower
    bound for the editing distance between two strings.
     */


    //Avoid division by zero
    if(strA.length === 0 && strB.length === 0) {
        return defaultValue;
        //Edge cases
    }

    /*
    The parameter q should be chosen according to the length of the two strings. For max(|A|, |B|) < 100,
    it defaults to 2 and 4 otherwise
     */
    if (q == null) {
        if (Math.max(strA.length, strB.length) < 100) {
            q = 2;
        } else {
            q = 4;
        }
    }

    //Avoid unnecessary computations for short strings
    if(strA.length < q || strB.length < q) {
        return strA === strB ? 0 : 1;
    }

    function qGramMap(str) {
        const qGrams = new Map();
        for (let i = 0; i + q <= str.length; i++) {
            const qGram = str.slice(i, i + q);
            if (!qGrams.has(qGram)) {
                //initial count
                qGrams.set(qGram, 0);
            }
            //update value
            qGrams.set(qGram, qGrams.get(qGram) + 1);
        }
        return qGrams;
    }

    //Compute q-gram profiles for A and B
    const qGramsA = qGramMap(strA);
    const qGramsB = qGramMap(strB);

    //compute q-gram distance
    let qGramDist = 0;
    for (const [qGram, count] of qGramsA) {
        if (qGramsB.has(qGram)) {
            qGramDist += Math.abs(count - qGramsB.get(qGram));
            //delete processed q-grams
            qGramsB.delete(qGram);
        } else {
            //count in B is 0 implicitly
            qGramDist += count;
        }
    }

    //check for unique qGrams in B
    for (const [qGram, count] of qGramsB) {
        //count in A is 0 implicitly
        qGramDist += count;
    }

    return (qGramDist / 2*q) / (strA.length + strB.length);
}


export function levenstein(a, b) {
    if(a.length == 0) return b.length;
    if(b.length == 0) return a.length;

    // swap to save some memory O(min(a,b)) instead of O(a)
    if(a.length > b.length) {
        var tmp = a;
        a = b;
        b = tmp;
    }

    var row = [];
    // init the row
    for(var i = 0; i <= a.length; i++){
        row[i] = i;
    }

    // fill in the rest
    for(var i = 1; i <= b.length; i++){
        var prev = i;
        for(var j = 1; j <= a.length; j++){
            var val;
            if(b.charAt(i-1) == a.charAt(j-1)){
                val = row[j-1]; // match
            } else {
                val = Math.min(row[j-1] + 1, // substitution
                    prev + 1,     // insertion
                    row[j] + 1);  // deletion
            }
            row[j - 1] = prev;
            prev = val;
        }
        row[a.length] = prev;
    }

    return row[a.length];
}






