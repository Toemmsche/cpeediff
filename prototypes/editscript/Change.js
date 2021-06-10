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

const xmldom = require("xmldom");
const vkbeautify = require("vkbeautify");
const {CpeeNode} = require("../cpee/CpeeNode");
const {Dsl} = require("../Dsl");
const {Serializable} = require("../utils/Serializable");

class Change extends Serializable {

    changeType;
    oldPath;
    newPath;
    newData;

    constructor(changeType, oldPath = null, newPath = null, newData = null) {
        super();
        this.changeType = changeType;
        this.oldPath = oldPath;
        this.newPath = newPath;
        this.newData = newData;
    }

    static parseFromXml(xml, xmlDom = false) {
        let root;
        if(xmlDom) {
            root = xml;
        } else {
            root = new DOMParser().parseFromString(xml, "text/xml").firstChild;
        }

        const [changeType, oldPath, newPath] = [root.localName, root.attributes.get("oldPath"), root.attributes.get("newPath")];
        let newData;
        for (let i = 0; i <root.childNodes.length ; i++) {
            const childTNode = root.childNodes.item(i);

            if(childTNode.localName === "newData") {
                newData = CpeeNode.parseFromXml(childTNode, true);
            }
        }
    }

    toString() {
        return this.changeType + " " +
            (this.oldPath !== null ? this.oldPath + " " : "") +
            (this.oldPath !== null && this.newPath !== null  ? "-> " : "") +
            (this.newPath !== null ? this.newPath + " " : "") +
            (this.newData !== null ? this.newData + " " : "");
    }

    convertToXml(xmlDom = false) {
        const doc = xmldom.DOMImplementation.prototype.createDocument(Dsl.NAMESPACES.DEFAULT_NAMESPACE_URI);

        const root = doc.createElement(this.changeType);
        if(this.oldPath != null) {
            root.setAttribute("oldPath", this.oldPath);
        }
        if(this.newPath != null) {
            root.setAttribute("newPath", this.newPath);
        }
        if(this.newData != null) {
            const newDataElement = doc.createElement("newData");
            newDataElement.appendChild(this.newData.convertToXml(true, true));
            root.appendChild(newDataElement);
        }

        if(xmlDom) {
            return root;
        } else {
            doc.insertBefore(root);
            return vkbeautify.xml(new xmldom.XMLSerializer().serializeToString(doc));
        }
    }
}

exports.Change = Change;