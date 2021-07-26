/*
    Copyright 2021 Tom Papke

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http=//www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

import {AbstractNodeFactory} from "./AbstractNodeFactory.js";
import {Node} from "./Node.js"
import xmldom from "xmldom";
import {DomHelper} from "../../DomHelper.js";

/**
 * Factory class for creating Node objects from an existing node ({@see Node}, {@see DeltaNode}, {@see MergeNode}),
 * an xmldom object (extraction) or an XML String (parsing).
 * @extends AbstractNodeFactory
 */
export class NodeFactory extends AbstractNodeFactory {

    /**
     * Create a new Node instance from an existing Node object.
     * Equivalent to copying the node (by value).
     * @param {Node} node The existing node object
     * @param {Boolean} includeChildren If the created node should include the children of the existing node.
     * @return Node A copy of the existing node
     */
    static _fromNode(node, includeChildren) {
        const copy = new Node(node.label, node.text);
        for (const [key, value] of node.attributes) {
            copy.attributes.set(key, value);
        }
        if (includeChildren) {
            for (const child of node) {
                copy.appendChild(this._fromNode(child, includeChildren));
            }
        }
        return copy;
    }

    /**
     * Create a new Node instance from an XML document (as a string).
     * @param {String} xml The source XML document as a string
     * @param {Boolean} includeChildren If the created node should include the children given in the XML document.
     * @return Node The corresponding root node of the XML document tree.
     */
    static _fromXmlString(xml, includeChildren) {
        //skip comments, text, and processing instructions
        return this._fromXmlDom(DomHelper.firstChildElement(
            new xmldom.DOMParser().parseFromString(xml, "text/xml")), includeChildren);
    }

    /**
     * Create a new Node instance from an xmldom object.
     * @param {Object} xmlElement The existing xmldom object
     * @param {Boolean} includeChildren If the created node should include the children of the xmldom object.
     * @return Node The corresponding root node of the XML DOM tree.
     */
    static _fromXmlDom(xmlElement, includeChildren) {
        let root = new Node(xmlElement.localName);

        if (!(xmlElement.nodeType === 1 || xmlElement.nodeType === 3)) {
            return null;
        }
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
                    //relevant data, set as node text
                    root.text = childElement.data;
                }
            } else if (childElement.nodeType === 1 && includeChildren) {
                const child = this._fromXmlDom(childElement, includeChildren);
                if (child != null) {
                    root.appendChild(child);
                }
            }
        }
        return root;
    }
}