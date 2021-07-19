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

import {Node} from "../tree/Node.js"
import {MergeNode} from "../tree/MergeNode.js";
import {DeltaNode} from "../tree/DeltaNode.js";
import {EditScript} from "../diff/delta/EditScript.js";
import {Change} from "../diff/delta/Change.js";
import xmldom from "xmldom";
import {Dsl} from "../Dsl.js";

export class XmlDomFactory {

    static convert(object) {

        switch (object.constructor) {
            case Node:
                return this._convertNode(object);
            case MergeNode:
                return this._convertDeltaNode(object);
            case DeltaNode:
                return this._convertDeltaNode(object);
            case EditScript:
                return this._convertEditScript(object);
            case Change:
                return this._convertChange(object);
        }
    }

    static _convertDeltaNode(deltaNode) {
        const doc = xmldom.DOMImplementation.prototype.createDocument(Dsl.DEFAULT_NAMESPACE);
        return buildRecursive(deltaNode);

        function buildRecursive(deltaNode) {

            const prefix = Object.values(Dsl.CHANGE_TYPES).find(ct => ct.label === deltaNode.changeType).prefix + ":"
            const xmlNode = doc.createElement(prefix + deltaNode.label);
            xmlNode.localName = deltaNode.label;

            //TODO delta variables
            if (deltaNode.isRoot()) {
                xmlNode.setAttribute("xmlns", Dsl.DEFAULT_NAMESPACE);
                for(const changeType of Object.values(Dsl.CHANGE_TYPES)) {
                    xmlNode.setAttribute("xmlns:" + changeType.prefix, changeType.uri);
                }
            }

            //set namespace of updated fields
            for (const [key, change] of deltaNode.updates) {
                const oldVal = change[0];
                const newVal = change[1];
                if (key === "text") {
                    deltaNode.attributes.set(Dsl.CHANGE_TYPES.UPDATE.label.prefix + ":text", "true");
                } else {
                    if (oldVal == null) {
                        const val = deltaNode.attributes.get(key);
                        deltaNode.attributes.set(Dsl.CHANGE_TYPES.INSERTION.prefix + ":" + key, val);
                        deltaNode.attributes.delete(key);
                    } else if (newVal == null) {
                        deltaNode.attributes.set(Dsl.CHANGE_TYPES.DELETION.prefix + ":" + key, oldVal);
                    } else {
                        const val = deltaNode.attributes.get(key);
                        deltaNode.attributes.set(Dsl.CHANGE_TYPES.UPDATE.label.prefix + ":" + key, val);
                        deltaNode.attributes.delete(key);
                    }
                }
            }

            for (const [key, value] of deltaNode.attributes) {
                xmlNode.setAttribute(key, value);
            }

            for (const child of deltaNode) {
                xmlNode.appendChild(buildRecursive(child));
            }

            if (deltaNode.text != null) {
                xmlNode.appendChild(doc.createTextNode(deltaNode.text))
            }

            return xmlNode;
        }
    }

    static _convertEditScript(editScript) {
        const doc = xmldom.DOMImplementation.prototype.createDocument(Dsl.DEFAULT_NAMESPACE);

        const xmlNode = doc.createElement("delta");
        xmlNode.setAttribute("cost", editScript.cost);
        for (const change of editScript.changes) {
            xmlNode.appendChild(this._convertChange(change));
        }

        return xmlNode;
    }

    static _convertNode(node) {
        const doc = xmldom.DOMImplementation.prototype.createDocument(Dsl.DEFAULT_NAMESPACE);
        return buildRecursive(node);

        function buildRecursive(node) {
            const xmlNode = doc.createElement(node.label);
            if (node.isRoot()) {
                xmlNode.setAttribute("xmlns", Dsl.DEFAULT_NAMESPACE);
            }
            for (const [key, value] of node.attributes) {
                xmlNode.setAttribute(key, value);
            }

            for (const child of node) {
                xmlNode.appendChild(buildRecursive(child));
            }

            if (node.text != null) {
                xmlNode.appendChild(doc.createTextNode(node.data))
            }
            return xmlNode;
        }
    }

    static _convertChange(change) {
        const doc = xmldom.DOMImplementation.prototype.createDocument(Dsl.DEFAULT_NAMESPACE);

        const xmlNode = doc.createElement(change.changeType);
        if (change.oldPath != null) {
            xmlNode.setAttribute("oldPath", change.oldPath);
        }
        if (change.newPath != null) {
            xmlNode.setAttribute("newPath", change.newPath);
        }
        if (change.newContent != null) {
            xmlNode.appendChild(this._convertNode(change.newContent, true));
        }

        return xmlNode;
    }
}
