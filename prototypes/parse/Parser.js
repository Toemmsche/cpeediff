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

const {Config} = require("../Config");
const {CpeeNode} = require("../CPEE/CpeeNode");
const {CpeeModel} = require("../CPEE/CpeeModel");
const {DOMParser} = require("xmldom");

class Parser {

    static fromCpee(xml, options = []) {
        //Parse options
        const doc = new DOMParser().parseFromString(xml.replaceAll(/\n|\t|\r|\f/g, ""), "text/xml").firstChild;
        const endpointToURL = new Map();
        if (doc.localName === "properties") {
            const declaredVariables = new Set();
            let root;
            for (let i = 0; i < doc.childNodes.length; i++) {
                const childTNode = doc.childNodes.item(i);
                if (childTNode.localName === "dataelements") {
                    for (let j = 0; j < childTNode.childNodes.length; j++) {
                        const variable = childTNode.childNodes.item(j);
                        if (variable.nodeType === 1) { //Element, not Text
                            declaredVariables.add(variable.localName);
                        }
                    }
                } else if (childTNode.localName === "dslx") {
                    let j = 0;
                    while (childTNode.childNodes.item(j).localName !== "description") j++;
                    root = constructRecursive(childTNode.childNodes.item(j));
                }

                //TODO test
                if(childTNode.localName === "endpoints") {
                    for (let j = 0; j < childTNode.childNodes.length; j++) {
                        const endpoint = childTNode.childNodes.item(j);
                        if (endpoint.nodeType === 1) { //Element, not Text
                            const url = endpoint.childNodes.item(0).data;
                            endpointToURL.set(endpoint, url);
                        }
                    }
                }
            }
            return new CpeeModel(root, declaredVariables);
        } else {
            //no information about declared Variables available
            return new CpeeModel(constructRecursive(doc));
        }

        function constructRecursive(tNode) {
            let root = new CpeeNode(tNode.localName);
            for (let i = 0; i < tNode.childNodes.length; i++) {
                const childTNode = tNode.childNodes.item(i);
                if (childTNode.nodeType === 3) { //text node
                    //check if text node contains a non-empty payload
                    if (childTNode.data.match(/^\s*$/) !== null) { //match whole string
                        //empty data, skip
                        continue;
                    } else {
                        //relevant data, set as node data
                        root.data = childTNode.data;
                    }
                } else {
                    const child = constructRecursive(childTNode)
                    //empty control nodes are null values (see below)
                    if (child !== null) {
                        //if this node has child properties, hoist them
                        if (!root.isPropertyNode() && child.isPropertyNode()) {
                            //remove unnecessary path
                            //first ancestor is parent of first entry in path
                            buildChildAttributeMap(child, root.attributes);
                        }
                        root.appendChild(child);
                    }
                }
            }

            function buildChildAttributeMap(node, map) {
                if (node.data != null) { //lossy comparison
                    //retain full (relative) structural information in the nodes
                    map.set("./" + node.toString(CpeeNode.STRING_OPTIONS.PATH), node.data);
                }

                //copy all values into new map
                for (const child of node.childNodes) {
                    buildChildAttributeMap(child, map);
                }
            }

            //if root cannot contain any semantic information, it is discarded
            if (root.isEmpty() || root.isDocumentation()) {
                return null;
            }

            //parse attributes
            for (let i = 0; i < tNode.attributes.length; i++) {
                const attrNode = tNode.attributes.item(i);
                //ignore semantically useless
                if(Config.PROPERTY_IGNORE_LIST.includes(attrNode.name)) {
                    continue;
                }
                //replace endpoint
                let value;
                //replace endpoint identifier with actual endpoint URL (if it exists)
                if(attrNode.name === "endpoint" && endpointToURL.has(attrNode.value)) {
                     value = endpointToURL.get(attrNode.value);
                } else if (attrNode.name === "endpoint" && attrNode.value == "") {
                  value =  Math.floor(Math.random * 1000000).toString(); //random endpoint
                } else {
                    value = attrNode.value;
                }
                root.attributes.set(attrNode.name, value);

            }

            //extract modified variables from code and read variables from call to endpoint
            if (root.containsCode()) {
                //match all variable assignments of the form variable_1.variable_2.variable_3 = some_value
                const matches = root.getCode().match(/data\.[a-zA-Z]+\w*(?: *( =|\+\+|--|-=|\+=|\*=|\/=))/g);
                if (matches !== null) {
                    for (const variable of matches) {
                        //match only variable name and remove data. prefix
                        root.modifiedVariables.add(variable.match(/(?:data\.)[a-zA-Z]+\w*/g)[0].replace(/data\./, ""));
                    }
                }

                for (const [key, value] of root.attributes) {
                    if (key.startsWith("./parameters/arguments/")) {
                        root.readVariables.add(value.replace(/data\./, ""));
                    }
                }
            }

            //extract read Variables from condition
            if (root.containsCondition()) {
                const condition = root.attributes.get("condition");
                const matches = condition.match(/data\.[a-zA-Z]+\w*(?: *(<|<=|>|>=|==|===|!=|!==))/g);
                if (matches !== null) {
                    for (const variable of matches) {
                        //match only variable name and remove data. prefix
                        root.readVariables.add(variable.match(/(?:data\.)[a-zA-Z]+\w*/g)[0].replace(/data\./, ""));
                    }
                }
            }

            return root;
        }
    }
}

exports.Parser = Parser;