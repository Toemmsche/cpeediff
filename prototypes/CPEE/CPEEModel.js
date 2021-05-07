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
const {Parallel} = require("./inner_nodes/Parallel");
const {ParallelBranch} = require("./inner_nodes/ParallelBranch");
const {Root} = require("./inner_nodes/Root");

//TODO doc
class CPEEModel {

    //CPEENode
    root;
    AVAILABLE_PARSE_OPTIONS = {}

    constructor(root) {
        this.root = root;
    }

    //Standard XML file (not a CPEE model)
    static from(xml) {
        //Parse options
        const doc = new DOMParser().parseFromString(xml.replaceAll(/\n|\t|\r|\f/g, ""), "text/xml").firstChild;
        const model = new CPEEModel(constructRecursive(doc));
        return model;

        function constructRecursive(tNode, parentCpeeNode = null, childIndex = -1) {
            const root = new CPEENode(tNode.tagName, parentCpeeNode, childIndex);
            childIndex = 0;
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

        function constructRecursive(tNode, parentCpeeNode = null, childIndex = -1) {
            let root;
            switch (tNode.tagName) {
                case DSL.CALL:
                    root = new Call(parentCpeeNode, childIndex);
                    break;
                case DSL.MANIPULATE:
                    root = new Manipulate(parentCpeeNode, childIndex);
                    break;
                case DSL.PARALLEL:
                    root = new Parallel(parentCpeeNode, childIndex);
                    break;
                case DSL.PARALLEL_BRANCH:
                    root = new ParallelBranch(parentCpeeNode, childIndex);
                    break;
                case DSL.CHOOSE:
                    root = new Choose(parentCpeeNode, childIndex);
                    break;
                case DSL.ALTERNATIVE:
                    root = new Alternative(parentCpeeNode, childIndex);
                    break;
                case DSL.OTHERWISE:
                    root = new Otherwise(parentCpeeNode, childIndex);
                    break;
                case DSL.ESCAPE:
                    root = new Escape(parentCpeeNode, childIndex);
                    break;
                case DSL.STOP:
                    root = new Stop(parentCpeeNode, childIndex);
                    break;
                case DSL.LOOP:
                    root = new Loop(parentCpeeNode, childIndex);
                    break;
                case DSL.TERMINATE:
                    root = new Terminate(parentCpeeNode, childIndex);
                    break;
                case DSL.CRITICAL:
                    root = new Critical(parentCpeeNode, childIndex);
                    break;
                case DSL.ROOT:
                    root = new Root(parentCpeeNode, childIndex);
                    break;
                default:
                    root = new CPEENode(tNode.tagName, parentCpeeNode, childIndex);
            }

            //Description nodes (that are not the root) contain documentation and are irrelevant for a semantic diff algorithm
            if(root.label === "description" && root.parent !== null) {
                return null;
            }

            childIndex = 0;
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
                } else if (root.isControlFlowLeafNode()) {
                    //childindex doesnt matter since these child nodes are converted into maps anyways
                    const property = constructRecursive(tNode.childNodes.item(i), root, 0);
                    //child can be null if it doesnt contain any data (see below)
                    if(property !== null) {
                        root.tempSubTree.push(property);
                    }
                } else {
                    const child = constructRecursive(tNode.childNodes.item(i), root, childIndex)
                    //empty control nodes are null values (see below)
                    if (child !== null) {
                        root.childNodes.push(child);
                        childIndex++;
                    }
                }
            }
            //if root is a control node or a call property but has no children and no data, we can safely disregard it
            if (root.childNodes.length === 0 && !root.isControlFlowLeafNode() && root.data == "") {
                return null;
            }
            //sort if order of childNodes is irrelevant
            if (!root.hasInternalOrdering()) {
                root.childNodes.sort((a, b) => a.label.localeCompare(b.label));
            }
            //parse attributes
            for (let i = 0; i < tNode.attributes.length; i++) {
                const attrNode = tNode.attributes.item(i);
                root.attributes.set(attrNode.name, attrNode.value);
            }
            //if root is a leaf node, we transform child notes into attributes
            if (root.isControlFlowLeafNode() && root.tempSubTree !== undefined) {
                const childAttributeMap = new Map();
                for (const child of root.tempSubTree) {
                    buildChildAttributeMap(child, childAttributeMap);
                }
                root.childAttributes = childAttributeMap;
                root.tempSubTree = undefined;
            }

            function buildChildAttributeMap(cpeeNode, map) {
                if (cpeeNode.data != "") { //lossy comparison
                    //retain full (relative) structural information in the nodes
                    //TODO dont assume unique labels for child attributes
                    map.set(cpeeNode.label, cpeeNode);
                }

                for (const child of cpeeNode.childNodes) {
                    buildChildAttributeMap(child, map);
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

}

exports.CPEEModel = CPEEModel;