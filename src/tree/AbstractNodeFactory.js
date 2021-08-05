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

import {Node} from "./Node.js";
import {DeltaNode} from "../patch/DeltaNode.js";
import {MergeNode} from "../merge/MergeNode.js";

/**
 * Abstract superclass for all node factories.
 * Node factories allow the creation of nodes ({@see Node}, {@see DeltaNode}, {@see MergeNode})
 * from an existing node instance (copy/transformation), an xmldom object (extraction) or an XML String (parsing).
 * @abstract
 */
export class AbstractNodeFactory {

    /**
     * Create a new node from a source.
     * @param {String|Node|DeltaNode|MergeNode|Object} source The source object or String.
     * @param {Boolean} includeChildren If the created node should include the children present in the source.
     * @returns {Node|DeltaNode|MergeNode} The newly created node.
     */
    static getNode(source, includeChildren = true) {
        switch (source.constructor) {
            case Node:
                return this._fromNode(source, includeChildren);
            case DeltaNode:
                return this._fromDeltaNode(source, includeChildren);
            case MergeNode:
                return this._fromMergeNode(source, includeChildren);
            case String:
                return this._fromXmlString(source, includeChildren);
            default:
                //probably an xmldom object
                return this._fromXmlDom(source, includeChildren);
        }
    }

    /**
     * Create a new node from a Node object.
     * @param {Node} node The existing node object
     * @param {Boolean} includeChildren If the created node should include the children of the existing node.
     * @throws Error
     * @private
     */
    static _fromNode(node, includeChildren) {
        throw new Error("Interface method not implemented");
    }

    /**
     * Create a new node from a DeltaNode object.
     * @param {DeltaNode} deltaNode The existing delta node
     * @param {Boolean} includeChildren If the created node should include the children of the existing delta node.
     * @throws Error This is an abstract method
     * @private
     */
    static _fromDeltaNode(deltaNode, includeChildren) {
        throw new Error("Interface method not implemented");
    }

    /**
     * Create a new node from a MergeNode object.
     * @param {MergeNode} mergeNode The existing merge node
     * @param {Boolean} includeChildren If the created node should include the children of the existing merge node.
     * @throws Error This is an abstract method
     * @private
     */
    static _fromMergeNode(mergeNode, includeChildren) {
        throw new Error("Interface method not implemented");
    }

    /**
     * Create a new node from an XML document (as a string).
     * @param {String} xml The source XML document as a string
     * @param {Boolean} includeChildren If the created node should include the children given in the XML document.
     * @throws Error This is an abstract method
     * @private
     */
    static _fromXmlString(xml, includeChildren) {
        throw new Error("Interface method not implemented");
    }

    /**
     * Create a new node from an xmldom object.
     * @param {Object} xmlElement The existing xmldom object
     * @param {Boolean} includeChildren If the created node should include the children of the xmldom object.
     * @throws Error This is an abstract method
     * @private
     */
    static _fromXmlDom(xmlElement, includeChildren) {
        throw new Error("Interface method not implemented");
    }

}