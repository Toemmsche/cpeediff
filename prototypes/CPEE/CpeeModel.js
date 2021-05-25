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

const {CpeeNode} = require("./CpeeNode");
const {DOMParser} = require("xmldom");

//TODO doc
class CpeeModel {

    //CpeeNode
    root;

    declaredVariables;

    constructor(root, declaredVariables = new Set()) {
        this.root = root;
        this.declaredVariables = declaredVariables;
    }

    //TODO doc
    static fromCpee(xml, options = []) {
        //Parse options
        const doc = new DOMParser().parseFromString(xml.replaceAll(/\n|\t|\r|\f/g, ""), "text/xml").firstChild;
        if (doc.tagName === "properties") {
            const declaredVariables = new Set();
            let root;
            for (let i = 0; i < doc.childNodes.length; i++) {
                const childTNode = doc.childNodes.item(i);
                if (childTNode.tagName === "dataelements") {
                    for (let j = 0; j < childTNode.childNodes.length; j++) {
                        const variable = childTNode.childNodes.item(j);
                        if (variable.nodeType === 1) { //Element, not Text
                            declaredVariables.add(variable.tagName);
                        }
                    }
                } else if (childTNode.tagName === "dslx") {
                    let j = 0;
                    while (childTNode.childNodes.item(j).tagName !== "description") j++;
                    root = constructRecursive(childTNode.childNodes.item(j));
                }
            }
            return new CpeeModel(root, declaredVariables);
        } else {
            //no information about declared Variables available
            return new CpeeModel(constructRecursive(doc));
        }

        function constructRecursive(tNode) {
            let root = new CpeeNode(tNode.tagName);
            for (let i = 0; i < tNode.childNodes.length; i++) {
                const childTNode = tNode.childNodes.item(i);
                if (childTNode.nodeType === 3) { //text node
                    //check if text node contains a non-empty payload
                    if (childTNode.data.match(/^\s*$/) !== null) { //match whole string
                        //empty data, skip
                        continue;
                    } else {
                        //relevant data, set as node data
                        root.data = childTNode.data;
                    }
                } else {
                    const child = constructRecursive(childTNode)
                    //empty control nodes are null values (see below)
                    if (child !== null) {
                        //if this node has child properties, hoist them
                        if (!root.isPropertyNode() && child.isPropertyNode()) {
                            //remove unnecessary path
                            //first ancestor is parent of first entry in path
                            buildChildAttributeMap(child, root.attributes);
                        } else {
                            root.appendChild(child);
                        }
                    }
                }
            }

            function buildChildAttributeMap(node, map) {
                if (node.data != "") { //lossy comparison
                    //retain full (relative) structural information in the nodes
                    map.set("./" + node.toString(CpeeNode.STRING_OPTIONS.PATH), node.data);
                }

                //copy all values into new map
                for (const child of node.childNodes) {
                    buildChildAttributeMap(child, map);
                }
            }

            //if root cannot contain any semantic information, it is discarded
            if (root.isEmpty() || root.isDocumentation()) {
                return null;
            }

            //parse attributes
            for (let i = 0; i < tNode.attributes.length; i++) {
                const attrNode = tNode.attributes.item(i);
                root.attributes.set(attrNode.name, attrNode.value);
            }

            //extract modified variables from code and read variables from call to endpoint
            if (root.containsCode()) {
                const modifiedVariables = new Set();
                //match all variable assignments of the form variable_1.variable_2.variable_3 = some_value
                const matches = root.getCode().match(/data\.[a-zA-Z]+\w*(?: *( =|\+\+|--|-=|\+=|\*=|\/=))/g);
                if (matches !== null) {
                    for (const variable of matches) {
                        //match only variable name and remove data. prefix
                        modifiedVariables.add(variable.match(/(?:data\.)[a-zA-Z]+\w*/g)[0].replace(/data\./, ""));
                    }
                }
               root.modifiedVariables =  modifiedVariables;

                const readVariables = new Set();
                for(const[key, value] of root.attributes) {
                    if(key.startsWith("./parameters/arguments/")) {
                        readVariables.add(value.replace(/data\./, ""));
                    }
                }
                root.readVariables = readVariables;
            }

            //extract read Variables from condition
            if(root.containsCondition()) {
                const condition = root.attributes.get("condition");
                const readVariables = new Set();
                const matches = condition.match(/data\.[a-zA-Z]+\w*(?: *(<|<=|>|>=|==|===|!=|!==))/g);
                if (matches !== null) {
                    for (const variable of matches) {
                        //match only variable name and remove data. prefix
                        readVariables.add(variable.match(/(?:data\.)[a-zA-Z]+\w*/g)[0].replace(/data\./, ""));
                    }
                }
                root.readVariables = readVariables;
            }

            return root;
        }
    }

    toXml() {

    }

    //TODO doc
    toPreOrderArray() {
        return this.root.toPreOrderArray();
    }

    toPostOrderArray() {
        return this.root.toPostOrderArray();
    }

    leafNodes() {
        return this.toPreOrderArray().filter(n => !n.hasChildren());
    }

    toTreeString(stringOption = CpeeNode.STRING_OPTIONS.LABEL) {
        return this.root.toTreeString([], stringOption);
    }
}

exports.CpeeModel = CpeeModel;