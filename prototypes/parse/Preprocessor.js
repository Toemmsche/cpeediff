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

class Preprocessor {

    prepare(xml, options = []) {
        //Parse options
        const doc = new DOMParser().parseFromString(xml.replaceAll(/\n|\t|\r|\f/g, ""), "text/xml").firstChild;
        const endpointToURL = new Map();
        let model;
        if (doc.localName === "properties") {
            let root;
            for (let i = 0; i < doc.childNodes.length; i++) {
                const childTNode = doc.childNodes.item(i);
                if (childTNode.localName === "dslx") {
                    let j = 0;
                    while (childTNode.childNodes.item(j).localName !== "description") j++;
                    root =CpeeNode.parseFromXml(childTNode.childNodes.item(j), true);
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
            model = new CpeeModel(root);
        } else {
            //no information about declared Variables available
            model =  new CpeeModel(CpeeNode.parseFromXml(doc, true));
        }

        //preprocess model in post-order (bottom-up)
        for(const node of model.toPostOrderArray()) {
            //process attributes, only preserve relevant ones, force endpoint if call
            for(const key of node.attributes.keys()) {
                if(Config.PROPERTY_IGNORE_LIST.includes(key)) {
                    node.attributes.delete(key);
                }
            }
            if(node.attributes.has("endpoint")) {
                const endpoint = node.attributes.get("endpoint");
                //replace endpoint identifier with actual endpoint URL (if it exists)
                if (endpointToURL.has(endpoint)) {
                   node.attributes.set("endpoint", endpointToURL.get(endpoint));
                }
            } else if(node.label === Dsl.KEYWORDS.CALL.label) {
                node.attributes.set("endpoint", Math.floor(Math.random * 1000000).toString()); //random endpoint
            }

            //TODO move semantic methods that are only moved once to the caller class (or extractor)
            //todo rework this mdess
            if(!node.isControlFlowLeafNode() && (
                (node.isPropertyNode() && Config.PROPERTY_IGNORE_LIST.includes(node.label))
                || (!node.isPropertyNode() && !node.hasChildren())
                || (node.isPropertyNode() && node.isEmpty()))) {
                node.removeFromParent();
            }

            //TODO insert manipulate with all vars at begin
        }

        return model;
    }
}

exports.Preprocessor = Preprocessor;