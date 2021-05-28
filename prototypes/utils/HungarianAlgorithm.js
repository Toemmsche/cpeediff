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

const munkres = require("munkres-js");

class HungarianAlgorithm {

    static match(costMatrix) {
        const res = munkres(costMatrix);
        let val = 0;
        for(const [first ,second] of res) {
            val += costMatrix[first][second];
        }
        return val / costMatrix.length;
    }

    static matches(costMatrix) {
        return munkres(costMatrix);
    }

}

exports.HungarianAlgorithm = HungarianAlgorithm;

