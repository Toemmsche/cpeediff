/*
    Copyright 2021 Tom Papke

   Licensed under the Apache License, Version 2.0 (the "License"),
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/


export const Dsl = {

    ELEMENTS: {
        ROOT: {
            label: "description",
            isLeaf: false,
            isOrdered: true
        },
        CALL: {
            label: "call",
            isLeaf: true,
            isOrdered: false
        },
        MANIPULATE: {
            label: "manipulate",
            isLeaf: true,
            isOrdered: false
        },
        PARALLEL: {
            label: "parallel",
            isLeaf: false,
            isOrdered: false
        },
        PARALLEL_BRANCH: {
            label: "parallel_branch",
            isLeaf: false,
            isOrdered: true
        },
        CHOOSE: {
            label: "choose",
            isLeaf: false,
            isOrdered: false
        },
        ALTERNATIVE: {
            label: "alternative",
            isLeaf: false,
            isOrdered: true
        },
        OTHERWISE: {
            label: "otherwise",
            isLeaf: false,
            isOrdered: true
        },
        LOOP: {
            label: "loop",
            isLeaf: false,
            isOrdered: true
        },
        CRITICAL: {
            label: "critical",
            isLeaf: false,
            isOrdered: true
        },
        STOP: {
            label: "stop",
            isLeaf: true,
            isOrdered: false
        },
        ESCAPE: {
            label: "escape",
            isLeaf: true,
            isOrdered: false
        },
        TERMINATE: {
            label: "terminate",
            isLeaf: true,
            isOrdered: false
        }
    },

    CALL_PROPERTIES: {
        ENDPOINT: {
            label: "endpoint"
        },
        PARAMETERS: {
            label: "parameters",
            isOrdered: false,
        },
        LABEL: {
            label: "label",
            isOrdered: false
        },
        METHOD: {
            label: "method",
            isOrdered: false,
        },
        ARGUMENTS: {
            label: "arguments",
            isOrdered: true
        },
        CODE: {
            label: "code",
            isOrdered: false
        },
        PREPARE: {
            label: "prepare",
            isOrdered: false
        },
        FINALIZE: {
            label: "finalize",
            isOrdered: false
        },
        UPDATE: {
            label: "update",
            isOrdered: false
        },
        RESCUE: {
            label: "rescue",
            isOrdered: false
        }
    },

    INNER_PROPERTIES: {
        CONDITION: {
            label: "condition",
            isOrdered: false
        },
        MODE: {
            label: "mode",
            isOrdered: false
        }
    },
    ENDPOINT_METHODS: [":get", ":post", ":put", ":patch", ":delete"],
    CHOOSE_MODES: ["inclusive", "exclusive"],
    DATA_PASS: {
        VARIABLE_KEY: "pass",
        LOCAL_KEY: "local"
    },

    PROPERTY_IGNORE_LIST: ["id", "description", "xmlns", "documentation", "doc"],

    DEFAULT_NAMESPACE: "http://cpee.org/ns/description/1.0",
    CHANGE_MODEL: {
        INSERTION: {
            label: "INSERT",
            uri: "http://cpee.org/ns/description/1.0/insert",
            prefix: "ins"
        },
        DELETION: {
            label: "DELETE",
            uri: "http://cpee.org/ns/description/1.0/delete",
            prefix: "del"
        },
        MOVE_TO: {
            label: "MOVE_TO",
            uri: "http://cpee.org/ns/description/1.0/move-to",
            prefix: "movto",
        },
        MOVE_FROM: {
            label: "MOVE_FROM",
            uri: "http://cpee.org/ns/description/1.0/move-from",
            prefix: "movfr",
        },
        UPDATE: {
            label: "UPDATE",
            uri: "http://cpee.org/ns/description/1.0/update",
            prefix: "upd"
        },
        NIL: {
            label: "NIL",
            uri: "http://cpee.org/ns/description/1.0/nil",
            prefix: "nil"
        }
    }
}

Dsl.ELEMENT_SET = new Set(
    Object.values(Dsl.ELEMENTS)
    .map(k => k.label));

Dsl.LEAF_NODE_SET = new Set(
    Object.values(Dsl.ELEMENTS)
    .filter(k => k.isLeaf)
    .map(k => k.label));

Dsl.INNER_NODE_SET = new Set(
    Object.values(Dsl.ELEMENTS)
    .filter(k => !k.isLeaf)
    .map(k => k.label));

Dsl.INTERNAL_ORDERING_SET = new Set(
    Object.values(Dsl.ELEMENTS)
    .concat(Object.values(Dsl.CALL_PROPERTIES))
    .concat(Object.values(Dsl.INNER_PROPERTIES))
    .filter(k => k.isOrdered)
    .map(k => k.label));

Dsl.CHANGE_TYPE_SET = new Set(
    Object.values(Dsl.CHANGE_MODEL));

