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

export const Config = {


    COMPARATOR: {
        PATH_COMPARE_RANGE: 3,

        //General weights
        WRITTEN_VAR_WEIGHT: 2,
        READ_VAR_WEIGHT: 1,

        //Call weights
        CALL_ENDPOINT_WEIGHT: 3,
        CALL_METHOD_WEIGHT: 1,
        CALL_LABEL_WEIGHT: 0.5,
        CALL_ARGS_WEIGHT: 2,
        CALL_SERVICE_WEIGHT: 1.5,
        CALL_CODE_WEIGHT: 1,

        EPSILON_PENALTY: 0.01,

        CONTENT_WEIGHT: 5,
        STRUCTURE_WEIGHT: 1
    },

    COMPARISON_THRESHOLD: 0.4,

    EXACT_EDIT_SCRIPT: false,

    VARIABLE_PREFIX: "data.",
    ADD_INIT_SCRIPT: false,

    PRETTY_XML: false
}


