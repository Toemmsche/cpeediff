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
const {CpeeModel} = require("../cpee/CpeeModel");
const {Change} = require("../editscript/Change");
const {Dsl} = require("../Dsl");
const {EditScript} = require("../editscript/EditScript");
const {MergeNode} = require("../cpee/MergeNode");
const {DeltaNode} = require("../cpee/DeltaNode");
const {CpeeNode} = require("../cpee/CpeeNode");


class XmlDomFactory {

    static convert(object) {

        switch (object.constructor) {
            case CpeeNode:
                return this._convertCpeeNode(object);
            case MergeNode:
                return this._convertDeltaNode(object);
            case DeltaNode:
                return this._convertDeltaNode(object);
            case EditScript:
                return this._convertEditScript(object);
            case Change:
                return this._convertChange(object);
            case CpeeModel:
                return this._convertCpeeModel(object);
        }
    }

    static _convertDeltaNode(deltaNode) {
        const doc = xmldom.DOMImplementation.prototype.createDocument(Dsl.NAMESPACES.DEFAULT_NAMESPACE_URI);
        return buildRecursive(deltaNode);

        function buildRecursive(deltaNode) {
            const changeType = deltaNode.changeType;

            const prefix = Dsl.NAMESPACES[changeType + "_NAMESPACE_PREFIX"] + ":"
            const node = doc.createElement(prefix + deltaNode.label);
            node.localName = deltaNode.label;

            //TODO delta variables
            if (deltaNode.isRoot()) {
                node.setAttribute("xmlns", Dsl.NAMESPACES.DEFAULT_NAMESPACE_URI);
                node.setAttribute("xmlns:" + Dsl.NAMESPACES.NIL_NAMESPACE_PREFIX, Dsl.NAMESPACES.NIL_NAMESPACE_URI);
                node.setAttribute("xmlns:" + Dsl.NAMESPACES.INSERT_NAMESPACE_PREFIX, Dsl.NAMESPACES.INSERT_NAMESPACE_URI);
                node.setAttribute("xmlns:" + Dsl.NAMESPACES.DELETE_NAMESPACE_PREFIX, Dsl.NAMESPACES.DELETE_NAMESPACE_URI);
                node.setAttribute("xmlns:" + Dsl.NAMESPACES.MOVE_FROM_NAMESPACE_PREFIX, Dsl.NAMESPACES.MOVE_FROM_NAMESPACE_URI);
                node.setAttribute("xmlns:" + Dsl.NAMESPACES.MOVE_TO_NAMESPACE_PREFIX, Dsl.NAMESPACES.MOVE_TO_NAMESPACE_URI);
                node.setAttribute("xmlns:" + Dsl.NAMESPACES.UPDATE_NAMESPACE_PREFIX, Dsl.NAMESPACES.UPDATE_NAMESPACE_URI);
            }


            //set namespace of updated fields
            for (const [key, change] of deltaNode.updates) {
                const oldVal = change[0];
                const newVal = change[1];
                if (key === "data") {
                    deltaNode.attributes.set(Dsl.NAMESPACES.UPDATE_NAMESPACE_PREFIX + ":data", "true");
                } else {
                    if (oldVal == null) {
                        const val = deltaNode.attributes.get(key);
                        deltaNode.attributes.set(Dsl.NAMESPACES.INSERT_NAMESPACE_PREFIX + ":" + key, val);
                        deltaNode.attributes.delete(key);
                    } else if (newVal == null) {
                        deltaNode.attributes.set(Dsl.NAMESPACES.DELETE_NAMESPACE_PREFIX + ":" + key, oldVal);
                    } else {
                        const val = deltaNode.attributes.get(key);
                        deltaNode.attributes.set(Dsl.NAMESPACES.UPDATE_NAMESPACE_PREFIX + ":" + key, val);
                        deltaNode.attributes.delete(key);
                    }
                }
            }

            for (const [key, value] of deltaNode.attributes) {

                node.setAttribute(key, value);
            }

            for (const child of deltaNode) {
                node.appendChild(buildRecursive(child));
            }

            if (deltaNode.data != null) {
                node.appendChild(doc.createTextNode(deltaNode.data))
            }

            return node;
        }
    }

    static _convertEditScript(editScript) {
        const doc = xmldom.DOMImplementation.prototype.createDocument(Dsl.NAMESPACES.DEFAULT_NAMESPACE_URI);

        const root = doc.createElement("delta");
        for (const change of editScript.changes) {
            root.appendChild(this._convertChange(change));
        }

        return root;
    }

    static _convertCpeeNode(cpeeNode) {
        const doc = xmldom.DOMImplementation.prototype.createDocument(Dsl.NAMESPACES.DEFAULT_NAMESPACE_URI);
        return buildRecursive(cpeeNode);

        function buildRecursive(cpeeNode) {
            const node = doc.createElement(cpeeNode.label);
            if (cpeeNode.isRoot()) {
                node.setAttribute("xmlns", Dsl.NAMESPACES.DEFAULT_NAMESPACE_URI);
            }
            for (const [key, value] of cpeeNode.attributes) {
                node.setAttribute(key, value);
            }

            for (const child of cpeeNode) {
                node.appendChild(buildRecursive(child));
            }

            if (cpeeNode.data != null) {
                node.appendChild(doc.createTextNode(cpeeNode.data))
            }
            return node;
        }
    }

    static _convertChange(change) {
        const doc = xmldom.DOMImplementation.prototype.createDocument(Dsl.NAMESPACES.DEFAULT_NAMESPACE_URI);

        const root = doc.createElement(change.changeType);
        if (change.oldPath != null) {
            root.setAttribute("oldPath", change.oldPath);
        }
        if (change.newPath != null) {
            root.setAttribute("newPath", change.newPath);
        }
        if (change.newData != null) {
            const newDataElement = doc.createElement("newData");
            newDataElement.appendChild(this._convertCpeeNode(change.newData, true));
            root.appendChild(newDataElement);
        }

        return root;
    }

    static _convertCpeeModel(model) {
        return this.convert(model.root);
    }
}

exports.XmlDomFactory = XmlDomFactory;