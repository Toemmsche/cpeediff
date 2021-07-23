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
import {DeltaNode} from "./DeltaNode.js";
import {MergeNode} from "./MergeNode.js";

export class AbstractNodeFactory {

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
                return this._fromXmlDom(source, includeChildren);
        }
    }

    static _fromNode(node, includeChildren) {
        throw new Error("Interface method not implemented");
    }

    static _fromDeltaNode(deltaNode, includeChildren) {
        throw new Error("Interface method not implemented");
    }

    static _fromMergeNode(mergeNode, includeChildren) {
        throw new Error("Interface method not implemented");
    }

    static _fromXmlString(xml, includeChildren) {
        throw new Error("Interface method not implemented");
    }

    static _fromXmlDom(xmlElement, includeChildren) {
        throw new Error("Interface method not implemented");
    }

}