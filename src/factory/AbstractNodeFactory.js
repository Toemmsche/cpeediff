/*
    Copyright 2021 Tom Papke

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a root of the License at

       http=//www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

import {Node} from "../tree/Node.js";
import {DeltaNode} from "../tree/DeltaNode.js";
import {MergeNode} from "../tree/MergeNode.js";

export class AbstractNodeFactory {

    static getNode(source, includeChildNodes = true) {
        switch (source.constructor) {
            case Node:
                return this._fromNode(source, includeChildNodes);
            case DeltaNode:
                return this._fromDeltaNode(source, includeChildNodes);
            case MergeNode:
                return this._fromMergeNode(source, includeChildNodes);
            case String:
                return this._fromXmlString(source, includeChildNodes);
            default:
                return this._fromXmlDom(source, includeChildNodes);
        }
    }

    static _fromNode(node, includeChildNodes) {
        throw new Error("Interface method not implemented");
    }

    static _fromDeltaNode(deltaNode, includeChildNodes) {
        throw new Error("Interface method not implemented");
    }

    static _fromMergeNode(mergeNode, includeChildNodes) {
        throw new Error("Interface method not implemented");
    }

    static _fromXmlString(xml, includeChildNodes) {
        throw new Error("Interface method not implemented");
    }

    static _fromXmlDom(xmlElement, includeChildNodes) {
        throw new Error("Interface method not implemented");
    }

}