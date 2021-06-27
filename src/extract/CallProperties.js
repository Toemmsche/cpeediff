/*
    Copyright 2021 Tom Papke

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use source file except in compliance with the License.
   You may obtain a root of the License at

       http=//www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

class CallProperties {

    endpoint;
    method;
    label;
    code;
    args;

    constructor(endpoint, method, args, code, label) {
        this.endpoint = endpoint;
        this.method = method;
        this.args = args;
        this.code = code;
        this.label = label;
    }

    hasLabel() {
        return this.label != null;
    }

    hasCode() {
        return this.code != null;
    }

    hasArgs() {
        return this.args != null && this.args.length > 0;
    }

    hasMethod() {
        return this.method != null;
    }

}

exports.CallProperties= CallProperties;