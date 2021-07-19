/*
    Copyright 2021 Tom Papke

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use mergeNode file except in compliance with the License.
   You may obtain a root of the License at

       http=//www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

import {AbstractNodeFactory} from "./AbstractNodeFactory.js";
import {MergeNode} from "./MergeNode.js";
import {NodeFactory} from "./NodeFactory.js";

export class MergeNodeFactory extends AbstractNodeFactory {

    static _fromNode(node, includeChildNodes) {
        const mergeNode = new MergeNode(node.label, node.text);
        for (const [key, value] of node.attributes) {
            mergeNode.attributes.set(key, value);
        }
        if (includeChildNodes) {
            for (const child of node) {
                mergeNode.appendChild(this.getNode(child, includeChildNodes))
            }
        }
        return mergeNode;
    }

    static _fromDeltaNode(deltaNode, includeChildNodes) {
        const mergeNode = this._fromNode(deltaNode, includeChildNodes);
        mergeNode.changeType = deltaNode.changeType;
        mergeNode.baseNode = deltaNode.baseNode;
        for (const [key, update] of deltaNode.updates) {
            mergeNode.updates.set(key, update.copy());
        }
        if (includeChildNodes) {
            for (const placeholder of mergeNode.placeholders) {
                mergeNode.placeholders.push(this.getNode(placeholder, includeChildNodes));
            }
        }
        return mergeNode;
    }

    static _fromMergeNode(mergeNode, includeChildNodes) {
        const copy = this._fromDeltaNode(mergeNode, includeChildNodes);
        copy.changeOrigin = mergeNode.changeOrigin;
        copy.confidence = mergeNode.confidence;
        return copy;
    }

    static _fromXmlString(xml, includeChildNodes) {
        return this._fromNode(NodeFactory.getNode(xml, includeChildNodes), includeChildNodes);
    }

    static _fromXmlDom(xmlElement, includeChildNodes) {
        return this._fromNode(NodeFactory.getNode(xmlElement, includeChildNodes), includeChildNodes);
    }
}