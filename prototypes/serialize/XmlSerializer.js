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
const {CpeeNode} = require("../CPEE/CpeeNode");
const {Config} = require("../Config");
const vkbeautify = require("vkbeautify");

class XmlSerializer {

    static serializeModel(model) {
        const doc = xmldom.DOMImplementation.prototype.createDocument(Config.NAMESPACES.DEFAULT_NAMESPACE_URI);

        const root = constructRecursive(model.root);
        doc.insertBefore(root, null);
        return vkbeautify.xml(new xmldom.XMLSerializer().serializeToString(doc));

        function constructRecursive(cpeeNode) {
            const node = doc.createElement(cpeeNode.label);

            if (cpeeNode.label === CpeeNode.KEYWORDS.ROOT) {
                node.setAttribute("xmlns", Config.NAMESPACES.DEFAULT_NAMESPACE_URI);
            }

            for (const [key, value] of cpeeNode.attributes) {
                if (key.startsWith("./")) {
                    //skip "."
                    const labelArr = key.split("/").splice(1);
                    let parent = node;
                    for (const label of labelArr) {
                        let target = null;
                        for (let i = 0; i < parent.childNodes.length; i++) {
                            const childTNode = parent.childNodes.item(i);
                            if (childTNode.localName === label) {
                                target = childTNode;
                                break;
                            }
                        }
                        if (target === null) {
                            target = doc.createElement(label);
                            target.localName = label;
                            parent.appendChild(target);
                        }
                        parent = target;
                    }
                    //set data of parent
                    const data = doc.createTextNode(value);
                    parent.appendChild(data);
                } else {
                    node.setAttribute(key, value);
                }
            }

            for (const child of cpeeNode) {
                node.appendChild(constructRecursive(child));
            }

            return node;
        }
    }

    /**
     *
     * @param {CpeeModel} deltaTree
     */
    static serializeDeltaTree(deltaTree) {
        const doc = xmldom.DOMImplementation.prototype.createDocument(Config.NAMESPACES.DEFAULT_NAMESPACE_URI);

        const root = constructRecursive(deltaTree.root);
        doc.insertBefore(root, null);
        return vkbeautify.xml(new xmldom.XMLSerializer().serializeToString(doc));

        function constructRecursive(deltaNode) {

            const prefix = Config.NAMESPACES[deltaNode.changeType + "_NAMESPACE_PREFIX"] + ":"
            const node = doc.createElement(prefix + deltaNode.label);
            node.localName = deltaNode.label;

            if (deltaNode.label === CpeeNode.KEYWORDS.ROOT) {
                node.setAttribute("xmlns", Config.NAMESPACES.DEFAULT_NAMESPACE_URI);
                node.setAttribute("xmlns:" + Config.NAMESPACES.NIL_NAMESPACE_PREFIX, Config.NAMESPACES.NIL_NAMESPACE_URI);
                node.setAttribute("xmlns:" + Config.NAMESPACES.INSERT_NAMESPACE_PREFIX, Config.NAMESPACES.INSERT_NAMESPACE_URI);
                node.setAttribute("xmlns:" + Config.NAMESPACES.DELETE_NAMESPACE_PREFIX, Config.NAMESPACES.DELETE_NAMESPACE_URI);
                node.setAttribute("xmlns:" + Config.NAMESPACES.MOVE_FROM_NAMESPACE_PREFIX, Config.NAMESPACES.MOVE_FROM_NAMESPACE_URI);
                node.setAttribute("xmlns:" + Config.NAMESPACES.MOVE_TO_NAMESPACE_PREFIX, Config.NAMESPACES.MOVE_TO_NAMESPACE_URI);
                node.setAttribute("xmlns:" + Config.NAMESPACES.UPDATE_NAMESPACE_PREFIX, Config.NAMESPACES.UPDATE_NAMESPACE_URI);
            }

            for (const [key, value] of deltaNode.attributes) {
                if (key.startsWith("./")) {
                    //skip "."
                    const labelArr = key.split("/").splice(1);
                    let parent = node;
                    for (const label of labelArr) {
                        let target = null;
                        for (let i = 0; i < parent.childNodes.length; i++) {
                            const childTNode = parent.childNodes.item(i);
                            if (childTNode.localName === label) {
                                target = childTNode;
                                break;
                            }
                        }
                        if (target === null) {
                            target = doc.createElement(label);
                            target.localName = label;
                            parent.appendChild(target);
                        }
                        parent = target;
                    }
                    //set data of parent
                    const data = doc.createTextNode(value);
                    parent.appendChild(data);
                } else {
                    node.setAttribute(key, value);
                }
            }

            for (const child of deltaNode) {
                node.appendChild(constructRecursive(child));
            }

            return node;
        }

    }
}

exports.XmlSerializer = XmlSerializer;