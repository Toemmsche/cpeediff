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

const {CallProperties} = require("./CallProperties");
const {Dsl} = require("../Dsl");
const {AbstractExtractor} = require("./AbstractExtractor");

class CallPropertyExtractor extends AbstractExtractor {

    _extract(node) {
        if (node.label !== Dsl.KEYWORDS.CALL.label) {
            throw new Error("Cannot extract properties from non-call node");
        }
        const endpoint = node.attributes.get("endpoint");
        const parameters = node.childNodes.find(n => n.label === "parameters");

        const method = parameters.childNodes.find(n => n.label === "method").data;
        let label = parameters.childNodes.find(n => n.label === "label");
        if(label != null) {
            label = label.data;
        } else {
            label = "";
        }

        let args = parameters.childNodes.find(n => n.label === "arguments");
        if(args != null) {
            args = args
                .childNodes
                .map(n => n.data);
        } else {
            args = [];
        }

        let code = node.childNodes.find(n => n.label === "code");
        if(code != null) {
            code = code.childNodes
                .sort((a, b) => a.label.localeCompare(b.label))
                .map(n => n.data)
                .join("");
        } else {
            code = "";
        }

        this._memo.set(node, new CallProperties(endpoint, method, args, code, label));
    }

}

exports.CallPropertyExtractor = CallPropertyExtractor;