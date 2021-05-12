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
    //keywords of the CPEE domain specific language
    static ROOT = "description"
    static CALL = "call"
    static MANIPULATE = "manipulate"
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

    static hasInternalOrdering(nodeLabel) {
        return [this.LOOP, this.CRITICAL, this.ROOT, this.ALTERNATIVE, this.OTHERWISE, this.PARALLEL_BRANCH].includes(nodeLabel);
    }

    static isControlFlowLeafNode(nodeLabel) {
        return [this.CALL, this.MANIPULATE, this.TERMINATE, this.STOP, this.ESCAPE].includes(nodeLabel);
    }

    static hasPropertySubtree(nodeLabel) {
        return [this.CALL, this.MANIPULATE, this.TERMINATE, this.STOP, this.ESCAPE, this.OTHERWISE, this.ALTERNATIVE].includes(nodeLabel);
    }

}

exports.DSL = DSL;