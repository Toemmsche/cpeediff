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

import {Node} from "./Node.js";
import {DeltaNode} from "./DeltaNode.js";
import {MergeNode} from "./MergeNode.js";

export class AbstractNodeFactory {

    static getNode(source, includechildren = true) {
        switch (source.constructor) {
            case Node:
                return this._fromNode(source, includechildren);
            case DeltaNode:
                return this._fromDeltaNode(source, includechildren);
            case MergeNode:
                return this._fromMergeNode(source, includechildren);
            case String:
                return this._fromXmlString(source, includechildren);
            default:
                return this._fromXmlDom(source, includechildren);
        }
    }

    static _fromNode(node, includechildren) {
        throw new Error("Interface method not implemented");
    }

    static _fromDeltaNode(deltaNode, includechildren) {
        throw new Error("Interface method not implemented");
    }

    static _fromMergeNode(mergeNode, includechildren) {
        throw new Error("Interface method not implemented");
    }

    static _fromXmlString(xml, includechildren) {
        throw new Error("Interface method not implemented");
    }

    static _fromXmlDom(xmlElement, includechildren) {
        throw new Error("Interface method not implemented");
    }

}