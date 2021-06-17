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

const {CpeeNodeFactory} = require("./CpeeNodeFactory");
const {MergeNode} = require("../MergeNode");
const {AbstractNodeFactory} = require("./AbstractNodeFactory");

class MergeNodeFactory extends AbstractNodeFactory {

    static _fromCpeeNode(cpeeNode, includeChildNodes) {
        const mergeNode = new MergeNode(cpeeNode.label, cpeeNode.data);
        for (const [key, value] of cpeeNode.attributes) {
            mergeNode.attributes.set(key, value);
        }
        if (includeChildNodes) {
            for (const child of cpeeNode) {
                mergeNode.appendChild(this.getNode(child, includeChildNodes))
            }
        }
        return mergeNode;
    }

    static _fromDeltaNode(deltaNode, includeChildNodes) {
        const mergeNode = this._fromCpeeNode(deltaNode, includeChildNodes);
        mergeNode.changeType = deltaNode.changeType;
        mergeNode.baseNode = deltaNode.baseNode;
        for (const [key, change] of deltaNode.updates) {
            mergeNode.updates.set(key, change.slice());
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
        return copy;
    }

    static _fromXmlString(xml, includeChildNodes) {
        return this._fromCpeeNode(CpeeNodeFactory._fromXmlString(xml, includeChildNodes), includeChildNodes);
    }

    static _fromXmlDom(xmlElement, includeChildNodes) {
        return this._fromCpeeNode(CpeeNodeFactory._fromXmlString(xmlElement, includeChildNodes), includeChildNodes);
    }
}

exports.MergeNodeFactory = MergeNodeFactory;