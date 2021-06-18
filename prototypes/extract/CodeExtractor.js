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

const {AbstractExtractor} = require("./AbstractExtractor");

class CodeExtractor extends AbstractExtractor {

    _extract(node) {
        if (node.label === "manipulate") {
            this._memo.set(node, node.data);
        } else {
            let code = "";
            const codeNode = node._childNodes.find(n => n.label === "code");
            if(codeNode != null) {
                for (const child of codeNode) {
                    code += child.data;
                }
            }
            this._memo.set(node, code);
        }
    }

}

exports.CodeExtractor = CodeExtractor;