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

const xmldom = require("xmldom");
const {AbstractNodeFactory} = require("./AbstractNodeFactory");
const {CpeeNode} = require("../CpeeNode");

class CpeeNodeFactory extends AbstractNodeFactory {

    static _fromCpeeNode(cpeeNode, includeChildNodes) {
        const copy = new CpeeNode(cpeeNode.label, cpeeNode.data);
        for (const [key, value] of cpeeNode.attributes) {
            copy.attributes.set(key, value);
        }
        if (includeChildNodes) {
            for (const child of cpeeNode) {
                copy.appendChild(this._fromCpeeNode(child, includeChildNodes));
            }
        }
        return copy;
    }

    static _fromXmlString(xml, includeChildNodes) {
        return this._fromXmlDom(new xmldom.DOMParser().parseFromString(xml, "text/xml"), includeChildNodes);
    }

    static _fromXmlDom(xmlElement, includeChildNodes) {
        let root = new CpeeNode(xmlElement.localName);

        //parse attributes
        for (let i = 0; i < xmlElement.attributes.length; i++) {
            const attrNode = xmlElement.attributes.item(i);
            root.attributes.set(attrNode.name, attrNode.value);
        }

        for (let i = 0; i < xmlElement.childNodes.length; i++) {
            const childElement = xmlElement.childNodes.item(i);
            if (childElement.nodeType === 3) { //text node
                //check if text node contains a non-empty payload
                if (childElement.data.match(/^\s*$/) !== null) { //match whole string
                    //empty data, skip
                    continue;
                } else {
                    //relevant data, set as node data
                    root.data = childElement.data;
                }
            } else if (includeChildNodes) {
                const child = this._fromXmlDom(childElement, includeChildNodes);
                root.appendChild(child);
            }
        }
        return root;
    }

}

exports.CpeeNodeFactory = CpeeNodeFactory;