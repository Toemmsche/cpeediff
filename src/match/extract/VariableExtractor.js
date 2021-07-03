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

import {AbstractExtractor} from "./AbstractExtractor.js";
import {CallPropertyExtractor} from "./CallPropertyExtractor.js";
import {Dsl} from "../../Dsl.js";

export class VariableExtractor extends AbstractExtractor {

    callPropertyExtractor;

    constructor(callPropertyExtractor = new CallPropertyExtractor()) {
        super();
        this.callPropertyExtractor = callPropertyExtractor;
    }

    _extract(node) {
        this._memo.set(node, {
            modifiedVariables: this._getModifiedVariables(node),
            readVariables: this._getReadVariables(node)
        });
    }

    _getModifiedVariables(node) {
        let modifiedVariables = new Set();
        let code;
        if (node.label === Dsl.KEYWORDS.MANIPULATE.label) {
            code = node.data;
        } else if (node.label === Dsl.KEYWORDS.CALL.label) {
            code = this.callPropertyExtractor.get(node).code;
        }
        if (code != null) {
            modifiedVariables = new Set(this._modVarsFromString(code));
        }
        return modifiedVariables;
    }

    _getReadVariables(node) {
        const readVariables = new Set();
        if (node.attributes.has("condition")) {
            const condition = node.attributes.get("condition");
            for (const readVar of this._readVarsFromString(condition)) {
                readVariables.add(readVar);
            }
        }
        let code;
        if (node.label === Dsl.KEYWORDS.MANIPULATE.label) {
            code = node.data;
        } else if (node.label === Dsl.KEYWORDS.CALL.label) {
            code = this.callPropertyExtractor.get(node).code;
        }
        if (code != null) {
            for (const readVar of this._readVarsFromString(code)) {
                readVariables.add(readVar);
            }
        }
        if (node.label === Dsl.KEYWORDS.CALL.label) {
            const callProps = this.callPropertyExtractor.get(node);
            if (callProps.hasArgs()) {
                for (const arg of callProps.args) {
                    //do NOT use the label of the argument
                    if (arg.includes("data.")) {
                        readVariables.add(arg.replaceAll("data.", ""));
                    }
                }
            }
        }
        return readVariables;
    }

    _modVarsFromString(str) {
        //positive lookahead for assignment operators and positive lookbehind for "data." prefix
        const matches = str.match((/(?<=data\.)[a-zA-Z]\w*(?=\s*(=[^=]|\+=|\+\+|-=|--|\*=|\/=))/g));
        return matches == null ? [] : matches;
    }

    _readVarsFromString(str) {
        //negative lookahead for assignment operators and positive lookbehind for "data." prefix
        //Also, a positive lookahead for any non-word character is necessary to avoid matching a partial variable descriptor
        const matches = str.match(/(?<=data\.)[a-zA-Z]\w*(?=\s*\W)(?!\s*(=[^=]|\+=|\+\+|-=|--|\*=|\/=))/g);
        return matches == null ? [] : matches;
    }
}