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


class Lis {

    static getLis(arr) {
        //dp[i] contains the length of the longest sequence that ends at i
        const dp = new Array(arr.length);
        const parent = new Array(arr.length);

        //best value
        let max = 0;
        //Simple O(n²) algorithm to compute the LIS
        for (let i = 0; i < dp.length; i++) {
            dp[i] = 1;
            parent[i] = -1;
            for (let j = 0; j < i; j++) {
                if (arr[j] < arr[i] && dp[j] + 1 > dp[i]) {
                    dp[i] = dp[j] + 1;
                    parent[i] = j;
                }
            }
            //update best value
            if (dp[i] > dp[max]) {
                max = i;
            }
        }

        //construct array with indices of all elements that are part of the LIS
        const res = [];
        while(max !== -1) {
            res.unshift(max);
            max = parent[max];
        }

        return res;
    }

}

exports.Lis = Lis;