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

import {Node} from "../tree/Node.js"
import fs from "fs";
import {NodeFactory} from "../tree/NodeFactory.js";
import {Dsl} from "../Dsl.js";
import xmldom from "xmldom";
import {Config} from "../Config.js";
import {DomHelper} from "../../DomHelper.js";

export class Preprocessor {

    parseFromFile(path) {
        return this.parseWithMetadata(fs.readFileSync(path).toString())
    }

    parseWithMetadata(xml) {
        const endpointToUrl = new Map();
        const dataElements = new Map();

        //skip comments and processing instructions
        const root = DomHelper.firstChildElement(new xmldom.DOMParser().parseFromString(xml.replaceAll(/\n|\t|\r|\f/g, ""),
            "text/xml"));

        let tree;
        //TODO CONFIG for this
        if (root.localName === "properties") {
            for (let i = 0; i < root.childNodes.length; i++) {
                const childTNode = root.childNodes.item(i);
                if (childTNode.localName === "dslx") {
                    let j = 0;
                    while (childTNode.childNodes.item(j).localName !== "description") j++;
                    tree = NodeFactory.getNode(childTNode.childNodes.item(j), true);
                } else if (childTNode.localName === "endpoints") {
                    for (let j = 0; j < childTNode.childNodes.length; j++) {
                        const endpoint = childTNode.childNodes.item(j);
                        if (endpoint.nodeType === 1) { //Element, not Text
                            const url = endpoint.firstChild.data;
                            endpointToUrl.set(endpoint.localName, url);
                        }
                    }
                } else if (childTNode.localName === "dataelements") {
                    for (let j = 0; j < childTNode.childNodes.length; j++) {
                        const dataElement = childTNode.childNodes.item(j);
                        if (dataElement.nodeType === 1) { //Element, not Text
                            const initialValue = dataElement.firstChild.data;
                            dataElements.set(dataElement.localName, initialValue);
                        }
                    }
                }
            }

        } else {
            //hop straight into tree parsing
            tree = NodeFactory.getNode(root, true);
        }

        return this.prepareTree(tree, endpointToUrl, dataElements);
    }

    prepareTree(tree, endpointToUrl = new Map(), dataElements = new Map(), withInitScript = false) {
        //traverse tree in post-order (bottom-up)
        for (const node of tree.toPostOrderArray()) {
            //only preserve semantically relevant attributes
            for (const key of node.attributes.keys()) {
                if (Dsl.PROPERTY_IGNORE_LIST.includes(key) || node.attributes.get(key) === "") {
                    node.attributes.delete(key);
                } else {
                    //trim attribute value
                    const val = node.attributes.get(key);
                    const trimmedVal = val.trim();
                    //TODO trim ends of newlines
                    if(trimmedVal !== val) {
                        node.attributes.delete(key);
                        node.attributes.set(key, trimmedVal);
                    }
                }
            }
            //replace endpoint identifier with actual URL
            if (node.attributes.has(Dsl.CALL_PROPERTIES.ENDPOINT.label)) {
                const endpoint = node.attributes.get(Dsl.CALL_PROPERTIES.ENDPOINT.label);
                //replace endpoint identifier with actual endpoint URL (if it exists)
                if (endpointToUrl.has(endpoint)) {
                    node.attributes.set(Dsl.CALL_PROPERTIES.ENDPOINT.label, endpointToUrl.get(endpoint));
                }
            } else if (node.label === Dsl.ELEMENTS.CALL.label) {
                node.attributes.set(Dsl.CALL_PROPERTIES.ENDPOINT.label, Math.floor(Math.random * 1000000).toString()); //random endpoint
            }

            //trim irrelevant nodes
            if (node.isPropertyNode() && (Dsl.PROPERTY_IGNORE_LIST.includes(node.label) || node.isEmpty())
                || (node.isInnerNode() && !node.hasChildren() && !node.isRoot())
                || (node.label === Dsl.ELEMENTS.MANIPULATE.label) && (node.text == null || node.text === "")) {
                node.removeFromParent();
            }

            //trim data
            if (node.text != null) {
                node.text = node.text.trim();
            }
        }

        if (Config.ADD_INIT_SCRIPT && dataElements.size > 0) {
            //insert initializer for all declared variables at beginning of tree
            const script = new Node(Dsl.ELEMENTS.MANIPULATE.label);
            script.text = "";
            script.attributes.set("id", "init");
            for (const [dataElement, initialValue] of dataElements) {
                script.text += Config.VARIABLE_PREFIX + dataElement + " = " + initialValue + ";";
            }
            tree.insertChild(0, script);
        }

        return tree;
    }
}