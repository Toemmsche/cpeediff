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

import {AbstractNodeFactory} from "../tree/AbstractNodeFactory.js";
import {MergeNode} from "./MergeNode.js";
import {NodeFactory} from "../tree/NodeFactory.js";

export class MergeNodeFactory extends AbstractNodeFactory {

    static _fromNode(node, includeChildren) {
        const mergeNode = new MergeNode(node.label, node.text);
        for (const [key, value] of node.attributes) {
            mergeNode.attributes.set(key, value);
        }
        if (includeChildren) {
            for (const child of node) {
                mergeNode.appendChild(this.getNode(child, includeChildren))
            }
        }
        return mergeNode;
    }

    static _fromDeltaNode(deltaNode, includeChildren) {
        const mergeNode = this._fromNode(deltaNode, includeChildren);
        mergeNode.type = deltaNode.type;
        mergeNode.baseNode = deltaNode.baseNode;
        for (const [key, update] of deltaNode.updates) {
            mergeNode.updates.set(key, update.copy());
        }
        if (includeChildren) {
            for (const placeholder of mergeNode.placeholders) {
                mergeNode.placeholders.push(this.getNode(placeholder, includeChildren));
            }
        }
        return mergeNode;
    }

    static _fromMergeNode(mergeNode, includeChildren) {
        const copy = this._fromDeltaNode(mergeNode, includeChildren);
        copy.changeOrigin = mergeNode.changeOrigin;
        copy.confidence = mergeNode.confidence;
        return copy;
    }

    static _fromXmlString(xml, includeChildren) {
        return this._fromNode(NodeFactory.getNode(xml, includeChildren), includeChildren);
    }

    static _fromXmlDom(xmlElement, includeChildren) {
        return this._fromNode(NodeFactory.getNode(xmlElement, includeChildren), includeChildren);
    }
}