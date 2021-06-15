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

class Dsl {

    static KEYWORDS = {
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
    }

    static KEYWORD_SET = new Set(Object
        .keys(Dsl.KEYWORDS)
        .map(key => Dsl.KEYWORDS[key])
        .map(k => k.label));

    static LEAF_NODE_SET = new Set(Object
        .keys(Dsl.KEYWORDS)
        .map(key => Dsl.KEYWORDS[key])
        .filter(k => k.isLeaf)
        .map(k => k.label));

    static INNER_NODE_SET = new Set(Object
        .keys(Dsl.KEYWORDS)
        .map(key => Dsl.KEYWORDS[key])
        .filter(k => !k.isLeaf)
        .map(k => k.label));

    static INTERNAL_ORDERING_SET = new Set(Object
        .keys(Dsl.KEYWORDS)
        .map(key => Dsl.KEYWORDS[key])
        .filter(k => k.isOrdered)
        .map(k => k.label));

    static CHANGE_TYPES = {
        //TODO turn into objects with more info (e.g. namespaces)
        INSERTION: "INSERT",
        DELETION: "DELETE",
        SUBTREE_INSERTION: "INSERT SUBTREE",
        SUBTREE_DELETION: "DELETE SUBTREE",
        MOVE_TO: "MOVE_TO",
        MOVE_FROM: "MOVE_FROM",
        UPDATE: "UPDATE",
        NIL: "NIL"
    }

    static CHANGE_TYPE_SET = new Set(Object
        .keys(Dsl.CHANGE_TYPES)
        .map(key => Dsl.CHANGE_TYPES[key]));



    static NAMESPACES = {
        DEFAULT_NAMESPACE_URI: "http://cpee.org/ns/description/1.0",
        NIL_NAMESPACE_URI: "http://cpee.org/ns/description/1.0/nil",
        NIL_NAMESPACE_PREFIX: "nil",
        INSERT_NAMESPACE_URI: "http://cpee.org/ns/description/1.0/insert",
        INSERT_NAMESPACE_PREFIX: "ins",
        DELETE_NAMESPACE_URI: "http://cpee.org/ns/description/1.0/delete",
        DELETE_NAMESPACE_PREFIX: "del",
        MOVE_FROM_NAMESPACE_URI: "http://cpee.org/ns/description/1.0/move-from",
        MOVE_FROM_NAMESPACE_PREFIX: "movfr",
        MOVE_TO_NAMESPACE_URI: "http://cpee.org/ns/description/1.0/move-to",
        MOVE_TO_NAMESPACE_PREFIX: "movto",
        UPDATE_NAMESPACE_URI: "http://cpee.org/ns/description/1.0/update",
        UPDATE_NAMESPACE_PREFIX: "upd"
    }


}

exports.Dsl = Dsl;
