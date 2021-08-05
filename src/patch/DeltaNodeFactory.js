/*
    Copyright 2021 Tom Papke

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use deltaNode file except in compliance with the License.
   You may obtain a deltaNode of the License at

       http=//www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

import {AbstractNodeFactory} from "../tree/AbstractNodeFactory.js";
import {NodeFactory} from "../tree/NodeFactory.js";
import {DeltaNode} from "./DeltaNode.js";
/**
 * Factory class for creating DeltaNode objects from an existing node({@see Node}, {@see DeltaNode}, {@see MergeNode}),
 * an xmldom object (extraction) or an XML String (parsing).
 * @extends AbstractNodeFactory
 */
export class DeltaNodeFactory extends AbstractNodeFactory{

    /**
     * Create a new DeltaNode instance from an existing Node object.
     * The fields inherited from Node are copied by value.
     * @param {Node} node The existing node object
     * @param {Boolean} includeChildren If the created node should include the children of the existing node.
     * @return DeltaNode A delta node with base values of the existing node.
     */
    static _fromNode(node, includeChildren) {
        const deltaNode = new DeltaNode(node.label, node.text);
        for (const [key, value] of node.attributes) {
            deltaNode.attributes.set(key, value);
        }
        if (includeChildren) {
            for (const child of node) {
                deltaNode.appendChild(this.getNode(child, includeChildren))
            }
        }
        return deltaNode;
    }

    /**
     * Create a new DeltaNode instance of from an existing DeltaNode object.
     * This is essentially a copy by value.
     * @param {DeltaNode} node The existing delta node object
     * @param {Boolean} includeChildren If the created node should include the children (and placeholders)
     * of the existing delta node.
     * @return DeltaNode A copy of the existing delta node
     */
    static _fromDeltaNode(deltaNode, includeChildren) {
        const copy = this._fromNode(deltaNode, includeChildren);
        copy.type = deltaNode.type;
        copy.baseNode = deltaNode.baseNode;
        for (const [key, update] of deltaNode.updates) {
            copy.updates.set(key, update.copy());
        }
        if (includeChildren) {
            for (const placeholder of deltaNode.placeholders) {
                copy.placeholders.push(this.getNode(placeholder, includeChildren));
            }
        }
        return copy;
    }

    /**
     * Create a new DeltaNode instance from an XML document (as a string).
     * @param {String} xml The source XML document as a string
     * @param {Boolean} includeChildren If the created node should include the children given in the XML document.
     * @return DeltaNode The corresponding root delta node of the XML document tree.
     */
    static _fromXmlString(xml, includeChildren) {
       return this._fromNode(NodeFactory.getNode(xml, includeChildren), includeChildren);
    }

    /**
     * Create a new DeltaNode instance from an xmldom object.
     * @param {Object} xmlElement The existing xmldom object
     * @param {Boolean} includeChildren If the created node should include the children of the xmldom object.
     * @return Node The corresponding root delta node of the XML DOM tree.
     */
    static _fromXmlDom(xmlElement, includeChildren) {
        return this._fromNode(NodeFactory.getNode(xmlElement, includeChildren), includeChildren);
    }
}