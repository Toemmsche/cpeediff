/*
    Copyright 2021 Tom Papke

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http=//www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/



class DSL {
    //control flow constructs of the CPEE domain specific language
    static ROOT = "description"
    static SERVICE_CALL = "call"
    static SCRIPT = "manipulate"
    static PARALLEL = "parallel"
    static PARALLEL_BRANCH = "parallel_branch"
    static CHOOSE = "choose"
    static ALTERNATIVE = "alternative"
    static OTHERWISE = "otherwise"
    static LOOP = "loop"
    static CRITICAL = "critical"
    static STOP = "stop"
    static ESCAPE = "escape"
    static TERMINATE = "terminate"

    static hasInternalOrdering(nodeTag) {
        return nodeTag in [this.LOOP, this.CRITICAL, this.ROOT];
    }

    static isControlFlowLeafNode(nodeTag) {
        return nodeTag in [this.SERVICE_CALL, this.SCRIPT, this.TERMINATE, this.STOP, this.ESCAPE];
    }

}

exports.DSL = DSL;