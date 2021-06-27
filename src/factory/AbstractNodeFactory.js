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

const {MergeNode} = require("../cpee/MergeNode");
const {DeltaNode} = require("../cpee/DeltaNode");
const {CpeeNode} = require("../cpee/CpeeNode");

class AbstractNodeFactory {

    static getNode(source, includeChildNodes = true) {
        switch (source.constructor) {
            case CpeeNode:
                return this._fromCpeeNode(source, includeChildNodes);
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

    static _fromCpeeNode(cpeeNode, includeChildNodes) {
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

exports.AbstractNodeFactory = AbstractNodeFactory;