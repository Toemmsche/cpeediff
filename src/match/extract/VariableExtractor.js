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
import {Config} from "../../Config.js";

export class VariableExtractor extends AbstractExtractor {

    callPropertyExtractor;

    constructor(callPropertyExtractor = new CallPropertyExtractor()) {
        super();
        this.callPropertyExtractor = callPropertyExtractor;
    }

    _extract(node) {
        this._memo.set(node, {
            writtenVariables: this._getWrittenVariables(node),
            readVariables: this._getReadVariables(node),
            argVariables: this._getArgVariables(node)
        });
    }

    _getWrittenVariables(node) {
        let writtenVariables = new Set();
        let code;
        if (node.label === Dsl.ELEMENTS.MANIPULATE.label) {
            code = node.text;
        } else if (node.label === Dsl.ELEMENTS.CALL.label) {
            code = this.callPropertyExtractor.get(node).code;
        }
        if (code != null) {
            writtenVariables = new Set(this._modVarsFromString(code));
        }
        return writtenVariables;
    }

    _getReadVariables(node) {
        const readVariables = new Set();
        if (node.attributes.has(Dsl.INNER_PROPERTIES.CONDITION.label)) {
            const condition = node.attributes.get(Dsl.INNER_PROPERTIES.CONDITION.label);
            for (const readVar of this._readVarsFromString(condition)) {
                readVariables.add(readVar);
            }
        }
        let code;
        if (node.label === Dsl.ELEMENTS.MANIPULATE.label) {
            code = node.text;
        } else if (node.label === Dsl.ELEMENTS.CALL.label) {
            code = this.callPropertyExtractor.get(node).code;
        }
        if (code != null) {
            for (const readVar of this._readVarsFromString(code)) {
                readVariables.add(readVar);
            }
        }

        return readVariables;
    }

    _getArgVariables(node) {
        const argVariables = [];
        if (node.label === Dsl.ELEMENTS.CALL.label) {
            const callProps = this.callPropertyExtractor.get(node);
            if (callProps.hasArgs()) {
                for (const arg of callProps.args) {
                    //do NOT use the label of the argument
                    if (arg.includes(Config.VARIABLE_PREFIX)) {
                       argVariables.push(arg.replaceAll(Config.VARIABLE_PREFIX, ""));
                    }
                }
            }
        }
        return argVariables;
    }

    _modVarsFromString(str) {
        const prefix = Config.VARIABLE_PREFIX.replaceAll("." , "\\.");
        //positive lookahead for assignment operators and positive lookbehind for data element prefix
        const regex = new RegExp("(?<=" + prefix + ")[$_a-zA-Z](\\w|\\$)*(?=\\s*(=[^=]|\\+=|\\+\\+|-=|--|\\*=|\\/=))", "g")
        const matches = str.match(regex);
        return matches == null ? [] : matches;
    }

    _readVarsFromString(str) {
        const prefix = Config.VARIABLE_PREFIX.replaceAll("." , "\\.");
        //negative lookahead for assignment operators and positive lookbehind for data element prefix
        //Also, a positive lookahead for any non-word character is necessary to avoid matching a partial variable descriptor
        const regex = new RegExp("(?<="+ prefix +")[$_a-zA-Z](\\w|\\$)*(?=\\s*[^\\w_$])(?!\\s*=[^=])", "g");
        const matches = str.match(regex);
        return matches == null ? [] : matches;
    }
}