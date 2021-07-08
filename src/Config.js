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

export const Config =  {
    COMPARATOR: {
        PATH_COMPARE_RANGE: 5,
        CALL_ENDPOINT_WEIGHT: 0.6,
        CALL_MODVAR_WEIGHT: 0.25,
        CALL_READVAR_WEIGHT: 0.15,
        EPSILON_PENALTY: 0.01,
        LABEL_PENALTY: 0.1,
        METHOD_PENALTY: 0.1,
        MANIPULATE_MODVAR_WEIGHT: 0.7,
        MANIPULATE_READVAR_WEIGHT: 0.3,
        CONTENT_WEIGHT: 0.8,
        STRUCTURE_WEIGHT: 0.2
    },

    LEAF_SIMILARITY_THRESHOLD: 0.25,
    INNER_NODE_SIMILARITY_THRESHOLD: 0.4,

    EXACT_EDIT_SCRIPT: false,

    VARIABLE_PREFIX: "data."
}


