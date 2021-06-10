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

const {Dsl} = require("../Dsl");
const {Config} = require("../Config");
const {CpeeNode} = require("../cpee/CpeeNode");
const {CpeeModel} = require("../cpee/CpeeModel");
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
                if (childTNode.localName === "dslx") {
                    let j = 0;
                    while (childTNode.childNodes.item(j).localName !== "description") j++;
                    root = constructRecursive(childTNode.childNodes.item(j));
                } else if (childTNode.localName === "endpoints") {
                    for (let j = 0; j < childTNode.childNodes.length; j++) {
                        const endpoint = childTNode.childNodes.item(j);
                        if (endpoint.nodeType === 1) { //Element, not Text
                            const url = endpoint.childNodes.item(0).data;
                            endpointToURL.set(endpoint, url);
                        }
                    }
                }
            }
            return new CpeeModel(root);
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
                        root.appendChild(child);
                    }
                }
            }

            //parse attributes
            for (let i = 0; i < tNode.attributes.length; i++) {
                const attrNode = tNode.attributes.item(i);
                //ignore semantically irrelevant properties
                if (Config.PROPERTY_IGNORE_LIST.includes(attrNode.name)) {
                    continue;
                }

                let value;
                //replace endpoint identifier with actual endpoint URL (if it exists)
                if (attrNode.name === "endpoint" && endpointToURL.has(attrNode.value)) {
                    value = endpointToURL.get(attrNode.value);
                } else if (attrNode.name === "endpoint" && attrNode.value == "") {
                    value = Math.floor(Math.random * 1000000).toString(); //random endpoint
                } else {
                    value = attrNode.value;
                }
                root.attributes.set(attrNode.name, value);
            }
            //we need an endpoint for comparison purposes
            if(root.label === Dsl.KEYWORDS.CALL && !root.attributes.has("endpoint")) {
                root.attributes.set("endpoint", Math.floor(Math.random * 1000000).toString());
            }

            //if root cannot contain any semantic information, it is discarded
            if (root.isEmpty() || root.isDocumentation()) {
                return null;
            }

            return root;
        }
    }
}

exports.Parser = Parser;