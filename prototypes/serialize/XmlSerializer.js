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
const {CpeeNode} = require("../cpee/CpeeNode");
const {Config} = require("../Config");
const vkbeautify = require("vkbeautify");
const {Dsl} = require("../Dsl");
const {Change} = require("../editscript/Change");

class XmlSerializer {

    static serializeModel(model) {
        const doc = xmldom.DOMImplementation.prototype.createDocument(Dsl.NAMESPACES.DEFAULT_NAMESPACE_URI);

        const root = constructRecursive(model.root);
        doc.insertBefore(root, null);
        return vkbeautify.xml(new xmldom.XMLSerializer().serializeToString(doc));

        function constructRecursive(cpeeNode) {
            const node = doc.createElement(cpeeNode.label);

            if (cpeeNode.label === Dsl.KEYWORDS.ROOT) {
                node.setAttribute("xmlns", Dsl.NAMESPACES.DEFAULT_NAMESPACE_URI);
            }

            for (const [key, value] of cpeeNode.attributes) {
                node.setAttribute(key, value);
            }

            for (const child of cpeeNode) {
                node.appendChild(constructRecursive(child));
            }

            if(cpeeNode.data != null) {
                node.appendChild(doc.createTextNode(cpeeNode.data))
            }

            return node;
        }
    }

    /**
     *
     * @param {CpeeModel} model
     */
    static serializeDeltaTree(model) {
        const doc = xmldom.DOMImplementation.prototype.createDocument(Dsl.NAMESPACES.DEFAULT_NAMESPACE_URI);

        const root = constructRecursive(model.root);
        doc.insertBefore(root, null);
        return vkbeautify.xml(new xmldom.XMLSerializer().serializeToString(doc));

        function constructRecursive(cpeeNode) {

            let changeType;
            if(cpeeNode.changeType === Dsl.CHANGE_TYPES.NIL && cpeeNode.isUpdated()) {
                changeType = Dsl.CHANGE_TYPES.UPDATE;
            } else {
                changeType = cpeeNode.changeType;
            }
            const prefix = Dsl.NAMESPACES[changeType + "_NAMESPACE_PREFIX"] + ":"
            const node = doc.createElement(prefix + cpeeNode.label);
            node.localName = cpeeNode.label;

            if (cpeeNode.label === Dsl.KEYWORDS.ROOT) {
                node.setAttribute("xmlns", Dsl.NAMESPACES.DEFAULT_NAMESPACE_URI);
                node.setAttribute("xmlns:" + Dsl.NAMESPACES.NIL_NAMESPACE_PREFIX, Dsl.NAMESPACES.NIL_NAMESPACE_URI);
                node.setAttribute("xmlns:" + Dsl.NAMESPACES.INSERT_NAMESPACE_PREFIX, Dsl.NAMESPACES.INSERT_NAMESPACE_URI);
                node.setAttribute("xmlns:" + Dsl.NAMESPACES.DELETE_NAMESPACE_PREFIX, Dsl.NAMESPACES.DELETE_NAMESPACE_URI);
                node.setAttribute("xmlns:" + Dsl.NAMESPACES.MOVE_FROM_NAMESPACE_PREFIX, Dsl.NAMESPACES.MOVE_FROM_NAMESPACE_URI);
                node.setAttribute("xmlns:" + Dsl.NAMESPACES.MOVE_TO_NAMESPACE_PREFIX, Dsl.NAMESPACES.MOVE_TO_NAMESPACE_URI);
                node.setAttribute("xmlns:" + Dsl.NAMESPACES.UPDATE_NAMESPACE_PREFIX, Dsl.NAMESPACES.UPDATE_NAMESPACE_URI);
            }

            for (const [key, value] of cpeeNode.attributes) {
                node.setAttribute(key, value);
            }

            for (const child of cpeeNode) {
                node.appendChild(constructRecursive(child));
            }

            if(cpeeNode.data != null) {
                node.appendChild(doc.createTextNode(cpeeNode.data))
            }

            return node;
        }

    }
}

exports.XmlSerializer = XmlSerializer;