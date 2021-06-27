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

const {CpeeNodeFactory} = require("../factory/CpeeNodeFactory");
const {Dsl} = require("../Dsl");
const {Config} = require("../Config");
const {CpeeNode} = require("../cpee/CpeeNode");
const {CpeeModel} = require("../cpee/CpeeModel");
const {DOMParser} = require("xmldom");

class Preprocessor {

    parseWithMetadata(xml) {

        const endpointToUrl = new Map();
        const dataElements = new Map();

        //Parse options
        let doc = new DOMParser().parseFromString(xml.replaceAll(/\n|\t|\r|\f/g, ""), "text/xml").firstChild;

        while (doc.nodeType !== 1) {
            doc = doc.nextSibling;
        }

        let model;
        if (doc.localName === "properties") {
            let root;
            for (let i = 0; i < doc.childNodes.length; i++) {
                const childTNode = doc.childNodes.item(i);
                if (childTNode.localName === "dslx") {
                    let j = 0;
                    while (childTNode.childNodes.item(j).localName !== "description") j++;
                    model = new CpeeModel(CpeeNodeFactory.getNode(childTNode.childNodes.item(j), true));
                } else if (childTNode.localName === "endpoints") {
                    for (let j = 0; j < childTNode.childNodes.length; j++) {
                        const endpoint = childTNode.childNodes.item(j);
                        if (endpoint.nodeType === 1) { //Element, not Text
                            const url = endpoint.childNodes.item(0).data;
                            endpointToUrl.set(endpoint.localName, url);
                        }
                    }
                } else if (childTNode.localName === "dataelements") {
                    for (let j = 0; j < childTNode.childNodes.length; j++) {
                        const dataElement = childTNode.childNodes.item(j);
                        if (dataElement.nodeType === 1) { //Element, not Text
                            const initialValue = dataElement.childNodes.item(0).data;
                            dataElements.set(dataElement.localName, initialValue);
                        }
                    }
                }
            }

        } else {
            //no information about declared Variables available
            model = new CpeeModel(CpeeNodeFactory.getNode(doc, true));
        }


        return this.prepareModel(model, endpointToUrl, dataElements);

    }

    prepareModel(model, endpointToUrl = new Map(), dataElements = new Map(), withInitScript = false) {
        //traverse model in post-order (bottom-up)
        for (const node of model.toPostOrderArray()) {
            //only preserve semantically relevant attributes
            for (const key of node.attributes.keys()) {
                if (Dsl.PROPERTY_IGNORE_LIST.includes(key) || node.attributes.get(key) === "") {
                    node.attributes.delete(key);
                }
            }
            //replace endpoint identifier with actual URL
            if (node.attributes.has("endpoint")) {
                const endpoint = node.attributes.get("endpoint");
                //replace endpoint identifier with actual endpoint URL (if it exists)
                if (endpointToUrl.has(endpoint)) {
                    node.attributes.set("endpoint", endpointToUrl.get(endpoint));
                }
            } else if (node.label === Dsl.KEYWORDS.CALL.label) {
                node.attributes.set("endpoint", Math.floor(Math.random * 1000000).toString()); //random endpoint
            }

            //trim irrelevant nodes
            if (node.isPropertyNode() && (Dsl.PROPERTY_IGNORE_LIST.includes(node.label) || node.isEmpty())
                || (node.isInnerNode() && !node.hasChildren() && !node.isRoot())
                || (node.label === Dsl.KEYWORDS.MANIPULATE.label) && (node.data == null || node.data === "")) {
                node.removeFromParent();
            }

            //trim data
            if (node.data != null) {
                node.data = node.data.trim();
            }
        }

        if (withInitScript) {
            //insert initializer for all declared variables at beginning of model
            const script = new CpeeNode(Dsl.KEYWORDS.MANIPULATE.label);
            script.data = "";
            script.attributes.set("id", "init");
            for (const [dataElement, initialValue] of dataElements) {
                script.data += "data." + dataElement + " = " + initialValue + ";";
            }
            model.root.insertChild(0, script);
        }

        return model;
    }

}

exports.Preprocessor = Preprocessor;