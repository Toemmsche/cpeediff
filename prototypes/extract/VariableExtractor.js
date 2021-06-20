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

const {CodeExtractor} = require("./CodeExtractor");
const {Dsl} = require("../Dsl");
const {AbstractExtractor} = require("./AbstractExtractor");

class VariableExtractor extends AbstractExtractor {

    codeExtractor;

    constructor(codeExtractor = new CodeExtractor()) {
        super();
        this.codeExtractor = codeExtractor;
    }

    _extract(node) {
        this._memo.set(node, {
            modifiedVariables: this._getModifiedVariables(node),
            readVariables: this._getReadVariables(node)
        });
    }

    _getModifiedVariables(node) {
        const modifiedVariables = new Set();
        if (node.containsCode()) {
            //match all variable assignments
            const matches = this.codeExtractor.get(node).match(/data\.[a-zA-Z]+\w*(?: *( =|\+\+|--|-=|\+=|\*=|\/=))/g);
            if (matches !== null) {
                for (const variable of matches) {
                    //match only variable name and remove data. prefix
                    modifiedVariables.add(variable.match(/(?:data\.)[a-zA-Z]+\w*/g)[0].replace(/data\./, ""));
                }
            }
        }
        return modifiedVariables;
    }

    _getReadVariables(node) {
        const readVariables = new Set();
        //TODO read variables from code
        if (node.containsCondition()) {
            const condition = node.attributes.get("condition");
            const matches = condition.match(/data\.[a-zA-Z]+\w*(?: *(<|<=|>|>=|==|===|!=|!==))/g);
            if (matches !== null) {
                for (const variable of matches) {
                    //match only variable name and remove data. prefix
                    readVariables.add(variable.match(/(?:data\.)[a-zA-Z]+\w*/g)[0].replace(/data\./, ""));
                }
            }
        }
        if(node.label === Dsl.KEYWORDS.CALL.label) {
            const parameters = node.childNodes.find(n => n.label === "parameters");
            const args = parameters.childNodes.find(n => n.label === "arguments");
            for(const arg of args)  {
                //do NOT use the label of the argument
                readVariables.add(arg.data.replaceAll("data.", ""));
            }
        }
        return readVariables;
    }

}

exports.VariableExtractor = VariableExtractor;