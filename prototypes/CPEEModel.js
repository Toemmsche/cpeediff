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

const {CPEENode} = require("./CPEENode");
const {DOMParser} = require("xmldom");

//TODO doc
class CPEEModel {

    //CPEENode
    root;

    constructor() {
        this.root = undefined;
    }

    //TODO doc
    static from(xml) {
        const doc = new DOMParser().parseFromString(xml.replaceAll("\n", ""), "text/xml").firstChild;
        const model = new CPEEModel();
        model.root = constructRecursive(doc);
        return model;

        function constructRecursive(tNode) {
            const root = new CPEENode(tNode.tagName);
            for (let i = 0; i < tNode.childNodes.length; i++) {
                const childNode = tNode.childNodes.item(i);
                if (childNode.nodeType === 3) { //text node
                    root.data = childNode.data;
                } else {
                    root.childNodes.push(constructRecursive(tNode.childNodes.item(i)));
                }
            }
            for (let i = 0; i < tNode.attributes.length; i++) {
                const attrNode = tNode.attributes.item(i);
                root.attributes.set(attrNode.name, attrNode.value);
            }
            return root;
        }
    }

}

exports.CPEEModel = CPEEModel;