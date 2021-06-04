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

class Config {
    static LEAF_SIMILARITY_THRESHOLD = 0.25;
    static INNER_NODE_SIMILARITY_THRESHOLD = 0.4;

    static EXACT_EDIT_SCRIPT = false;


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

    static PROPERTY_IGNORE_LIST = ["id", "description"];
}

exports.Config = Config;
