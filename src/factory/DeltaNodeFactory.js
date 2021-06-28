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

const {CpeeNodeFactory} = require("./CpeeNodeFactory");
const {DeltaNode} = require("../cpee/DeltaNode");
const {AbstractNodeFactory} = require("./AbstractNodeFactory");

class DeltaNodeFactory extends AbstractNodeFactory{

    static _fromCpeeNode(cpeeNode, includeChildNodes) {
        const deltaNode = new DeltaNode(cpeeNode.label, cpeeNode.data);
        for (const [key, value] of cpeeNode.attributes) {
            deltaNode.attributes.set(key, value);
        }
        if (includeChildNodes) {
            for (const child of cpeeNode) {
                deltaNode.appendChild(this.getNode(child, includeChildNodes))
            }
        }
        return deltaNode;
    }

    static _fromDeltaNode(deltaNode, includeChildNodes) {
        const copy = this._fromCpeeNode(deltaNode, includeChildNodes);
        copy.changeType = deltaNode.changeType;
        copy.baseNode = deltaNode.baseNode;
        for (const [key, change] of deltaNode.updates) {
            copy.updates.set(key, Object.assign({}, change));
        }
        if (includeChildNodes) {
            for (const placeholder of deltaNode.placeholders) {
                copy.placeholders.push(this.getNode(placeholder, includeChildNodes));
            }
        }
        return copy;
    }

    static _fromXmlString(xml, includeChildNodes) {
       return this._fromCpeeNode(CpeeNodeFactory.getNode(xml, includeChildNodes), includeChildNodes);
    }

    static _fromXmlDom(xmlElement, includeChildNodes) {
        return this._fromCpeeNode(CpeeNodeFactory.getNode(xmlElement, includeChildNodes), includeChildNodes);
    }

}

exports.DeltaNodeFactory = DeltaNodeFactory;