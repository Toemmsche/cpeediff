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


const {DSL} = require("./DSL");
const {Call} = require("./leafs/Call");
const {CallWithScript} = require("./leafs/CallWithScript");
const {Escape} = require("./leafs/Escape");
const {Manipulate} = require("./leafs/Manipulate");
const {Stop} = require("./leafs/Stop");
const {Terminate} = require("./leafs/Terminate");
const {Alternative} = require("./inner_nodes/Alternative");
const {Choose} = require("./inner_nodes/Choose");
const {Critical} = require("./inner_nodes/Critical");
const {Loop} = require("./inner_nodes/Loop");
const {Otherwise} = require("./inner_nodes/Otherwise");
const {Parallel} = require("./inner_nodes/Paralel");
const {ParallelBranch} = require("./inner_nodes/ParallelBranch");
const {Root} = require("./inner_nodes/Root");

//TODO doc
class CPEEModel {

    //CPEENode
    root;

    constructor(root) {
        this.root = root;
    }

    //Standard XML file (not a CPEE model)
    static from(xml) {
        //Parse options
        const doc = new DOMParser().parseFromString(xml.replaceAll(/\n|\t|\r|\f/g, ""), "text/xml").firstChild;
        const model = new CPEEModel(constructRecursive(doc));
        return model;

        function constructRecursive(tNode) {
            const root = new CPEENode(tNode.tagName);
            for (let i = 0; i < tNode.childNodes.length; i++) {
                const childNode = tNode.childNodes.item(i);
                if (childNode.nodeType === 3) { //text node
                    //check if text node contains a non-empty payload
                    if (childNode.data.match(/^\s*$/) !== null) { //match whole string
                        //empty data, skip
                        continue;
                    } else {
                        //relevant data, set as node data
                        root.data = childNode.data;
                    }
                } else {
                    root.childNodes.push(constructRecursive(tNode.childNodes.item(i), root, childIndex++));
                }
            }

            for (let i = 0; i < tNode.attributes.length; i++) {
                const attrNode = tNode.attributes.item(i);
                root.attributes.set(attrNode.name, attrNode.value);
            }
            return root;
        }
    }

    //TODO doc
    static fromCPEE(xml, options = []) {
        //Parse options
        const doc = new DOMParser().parseFromString(xml.replaceAll(/\n|\t|\r|\f/g, ""), "text/xml").firstChild;
        const model = new CPEEModel(constructRecursive(doc));
        return model;

        function constructRecursive(tNode) {
            let root;
            switch (tNode.tagName) {
                case DSL.CALL:
                    root = new Call();
                    break;
                case DSL.MANIPULATE:
                    root = new Manipulate();
                    break;
                case DSL.PARALLEL:
                    root = new Parallel();
                    break;
                case DSL.PARALLEL_BRANCH:
                    root = new ParallelBranch();
                    break;
                case DSL.CHOOSE:
                    root = new Choose();
                    break;
                case DSL.ALTERNATIVE:
                    root = new Alternative();
                    break;
                case DSL.OTHERWISE:
                    root = new Otherwise();
                    break;
                case DSL.ESCAPE:
                    root = new Escape();
                    break;
                case DSL.STOP:
                    root = new Stop();
                    break;
                case DSL.LOOP:
                    root = new Loop();
                    break;
                case DSL.TERMINATE:
                    root = new Terminate();
                    break;
                case DSL.CRITICAL:
                    root = new Critical();
                    break;
                case DSL.ROOT:
                    root = new Root();
                    break;
                default:
                    root = new CPEENode(tNode.tagName);
            }

            //Description nodes (that are not the root) contain documentation and are irrelevant for a semantic diff algorithm
            if (root.label === "description" && root.parent !== null) {
                return null;
            }

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
                        //if child is not a control flow node, it's a property of root
                        if (child.isPropertyNode()) {
                            //remove unnecessary path
                            //TODO use childAttribues of first leaf node
                           buildChildAttributeMap(child, root.childAttributes);
                        } else {
                            root.insertChild(child);
                        }
                    }
                }
            }

            function buildChildAttributeMap(node, map) {
                if (node.data != "") { //lossy comparison
                    //retain full (relative) structural information in the nodes
                    map.set(node.toString(CPEENode.STRING_OPTIONS.PATH), node.data);
                }

                for (const child of node.childNodes) {
                    buildChildAttributeMap(child, map);
                }
            }
            
            //if root is a control node or a call property but has no children and no data, we can safely disregard it
            if (!root.hasChildren() && !root.isControlFlowLeafNode() && root.data == "") {
                return null;
            }

            //parse attributes
            for (let i = 0; i < tNode.attributes.length; i++) {
                const attrNode = tNode.attributes.item(i);
                root.attributes.set(attrNode.name, attrNode.value);
            }

            //extract necessary/declared data variables
            if (root.containsCode()) {
                let code = "";
                if (root instanceof Manipulate) {
                    code = root.data;
                } else {
                    //concatenate everything (if present)
                    const prepare = (root.childAttributes.has("code/prepare") ? root.childAttributes.get("code/prepare"): "");
                    const finalize =  (root.childAttributes.has("code/finalize") ? root.childAttributes.get("code/finalize") : "");
                    const update =  (root.childAttributes.has("code/update") ? root.childAttributes.get("code/update") : "");
                    const rescue =  (root.childAttributes.has("code/rescue") ? root.childAttributes.get("code/rescue") : "");
                    code = prepare + finalize + update + rescue;
                }

                if (code != "") {
                    //extract variables using regex
                    const touchedVariables = new Set();
                    //match all variable assignments of the form variable_1.variable_2.variable_3 = some_value
                    const matches = code.match(/([a-zA-Z]+\w*\.)*[a-zA-Z]+\w*(?: *( =|\+\+|--|-=|\+=|\*=|\/=))/g);
                    if(matches !== null) {
                        for (const variable of matches) {
                            //match only variable name
                            touchedVariables.add(variable.match(/([a-zA-Z]+\w*\.)*[a-zA-Z]+\w*/g)[0]);
                        }
                        root.touchedVariables = touchedVariables;
                    }
                }
            }

            return root;
        }
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

    toTreeString(stringOption = CPEENode.STRING_OPTIONS.LABEL) {
        return this.root.toTreeString([], stringOption);
    }

}

exports.CPEEModel = CPEEModel;