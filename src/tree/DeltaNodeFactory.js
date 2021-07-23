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

import {AbstractNodeFactory} from "./AbstractNodeFactory.js";
import {NodeFactory} from "./NodeFactory.js";
import {DeltaNode} from "./DeltaNode.js";

export class DeltaNodeFactory extends AbstractNodeFactory{

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

    static _fromXmlString(xml, includeChildren) {
       return this._fromNode(NodeFactory.getNode(xml, includeChildren), includeChildren);
    }

    static _fromXmlDom(xmlElement, includeChildren) {
        return this._fromNode(NodeFactory.getNode(xmlElement, includeChildren), includeChildren);
    }
}