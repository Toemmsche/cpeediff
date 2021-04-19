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

class CPEE {
    static DSL = {
        SERVICE_CALL: "call",
        SCRIPT: "manipulate",
        PARALLEL: "parallel",
        DECISION: "choose",
        LOOP: "loop",
        CRITICAL: "critical",
        STOP: "stop"
    }

    /**
     * Determines if the child nodes of a given node have an ordering associated with them or can be ordered
     * arbitrarily. E.g. child nodes of Service Calls are unordered, child nodes of loops are ordered.
     * @param node The string tag of the node inside the CPEE process model.
     * @return hasInternalOrder A boolean reflecting the truth value of the statement.
     */
    static hasInternalOrdering(node) {
        return (node === this.DSL.LOOP || node === this.DSL.CRITICAL);
    }

}

module.exports = CPEE;