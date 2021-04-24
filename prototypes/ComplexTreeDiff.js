/*
    Copyright 2021 Tom Papke

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

const {AbstractDiff} = require("./AbstractDiff");
const {XMLTools} = require("./XMLTools");
const {DOMParser, XMLSerializer} = require("xmldom");

class ComplexTreeDiff extends AbstractDiff {

    /**
     * Instantiate a ComplexTreeDiff object with the given models and options.
     * @param {String} xml1 The original CPEE process model as an XML document
     * @param {String} xml2 The changed CPEE process model as an XML document
     * @param {String[]} options Additional options for the difference calculation
     */
    constructor(xml1, xml2, options = []) {
        super(xml1, xml2, options);
        this.AVAILABLE_OPTIONS = {
            ORDER: "order"
        }
    }

    //TODO
    diff() {
        //only order when "order" option is selected
        const xml1_ordered = this.options.includes(this.AVAILABLE_OPTIONS.ORDER) ?
            XMLTools.sortXML(this.xml1) : this.xml1;
        const xml2_ordered = this.options.includes(this.AVAILABLE_OPTIONS.ORDER) ?
            XMLTools.sortXML(this.xml2) : this.xml2;

        //First attempt: Output edit distance/similarity value

        //First stage: Get insert/delete cost for each subtree
        const parser = new DOMParser();
        const xmlTree1 = parser.parseFromString(xml1_ordered.replaceAll("\n", ""), "text/xml").firstChild;
        const xmlTree2 = parser.parseFromString(xml2_ordered.replaceAll("\n", ""), "text/xml").firstChild;

        //set sizes and depths
        XMLTools.setAttributes(xmlTree1);
        XMLTools.setAttributes(xmlTree2);

        for (let i = 0; i < xmlTree1.childNodes.length; i++) {
            outerLoop(xmlTree1.childNodes.item(i));
        }

        //For each subTree of xml1
        function outerLoop(tNode) {
            //set initial cost
            tNode.deleteTreeCost = tNode.subTreeSize;
            //adjust cost by comparing commonality to each subtree (not the whole tree) of xml2
            for (let i = 0; i < xmlTree2.childNodes.length; i++) {
                innerLoop(tNode, xmlTree2.childNodes.item(i));
            }
            for (let i = 0; i < tNode.childNodes.length; i++) {
                outerLoop(tNode.childNodes.item(i));
            }
        }

        //for each subTree of xml2
        function innerLoop(tNode1, tNode2) {
            const cbs = CBS(tNode1, tNode2);
            tNode2.insertTreeCost = Math.min(
                tNode2.subTreeSize,
                tNode2.insertTreeCost === undefined ? Infinity : tNode2.insertTreeCost,
                tNode2.subTreeSize
                * (1 / (1 + cbs / Math.max(tNode1.subTreeSize, tNode2.subTreeSize))));
            tNode1.deleteTreeCost = Math.min(
                tNode1.subTreeSize,
                tNode1.deleteTreeCost,
                tNode1.subTreeSize
                * (1 / (1 + cbs / Math.max(tNode1.subTreeSize, tNode2.subTreeSize))));

            for (let i = 0; i < tNode2.childNodes.length; i++) {
                innerLoop(tNode1, tNode2.childNodes.item(i));
            }
        }

        //calculates Commonality Between Subtress (CBS) for two given subtrees based on the edit distance
        function CBS(tNode1, tNode2) {

            //convert both subtrees to arrays of nodes in pre order
            const preArr1 = XMLTools.getPreOrderArray(tNode1);
            const preArr2 = XMLTools.getPreOrderArray(tNode2);
            const size1 = preArr1.length + 1;
            const size2 = preArr2.length + 1;

            const Dist = new Array(size1);
            for (let i = 0; i < Dist.length; i++) {
                Dist[i] = new Array(size2);
            }

            Dist[0][0] = 0;
            for (let i = 1; i < size1; i++) {
                //deleting a single node has unit costs
                Dist[i][0] = Dist[i - 1][0] + 1;
            }
            for (let j = 1; j < size2; j++) {
                //deleting a single node has unit costs
                Dist[0][j] = Dist[0][j - 1] + 1;
            }

            for (let i = 1; i < size1; i++) {
                for (let j = 1; j < size2; j++) {
                    //if both nodes have the same label and depth, we don't have the distance stays the same
                    Dist[i][j] = Math.min(
                        preArr1[i - 1].nodeName === preArr2[j - 1].nodeName
                        //only depth from subtree root node has to equal
                        && preArr1[i - 1].depth - tNode1.depth === preArr2[j - 1].depth - tNode2.depth ?
                            Dist[i - 1][j - 1] : Infinity,
                        Dist[i - 1][j] + 1, //deletion of preArr1[i] (unit cost)
                        Dist[i][j - 1] + 1, //insertion of preArr2[j] (unit cost)
                    );
                }
            }

            //commonality directly follows from the edit distance
            return (preArr1.length + preArr2.length - Dist[preArr1.length][preArr2.length]) / 2;
        }

        //Compare to whole Tree1 or whole Tree2
        function subTree1toT2(tNode) {
            tNode.deleteTreeCost = Math.min(
                tNode.deleteTreeCost,
                tNode.subTreeSize
                * (1 / (1 + CBS(tNode, xmlTree2) / Math.max(tNode.subTreeSize, xmlTree2.subTreeSize))));

            for (let i = 0; i < tNode.childNodes.length; i++) {
                subTree1toT2(tNode.childNodes.item(i));
            }
        }

        function subTree2toT1(tNode) {
            tNode.insertTreeCost = Math.min(
                tNode.insertTreeCost,
                tNode.subTreeSize
                * (1 / (1 + CBS(tNode, xmlTree1) / Math.max(tNode.subTreeSize, xmlTree1.subTreeSize))));
            for (let i = 0; i < tNode.childNodes.length; i++) {
                subTree2toT1(tNode.childNodes.item(i));
            }
        }

        for (let i = 0; i < xmlTree1.childNodes.length; i++) {
            subTree1toT2(xmlTree1.childNodes.item(i));
        }
        for (let i = 0; i < xmlTree2.childNodes.length; i++) {
            subTree2toT1(xmlTree2.childNodes.item(i));
        }


        function editDistance(tNode1, tNode2) {
            const size1 = tNode1.childNodes.length + 1;
            const size2 = tNode2.childNodes.length + 1;

            const Dist = new Array(size1);
            for (let i = 0; i < Dist.length; i++) {
                Dist[i] = new Array(size2);
            }

            Dist[0][0] = tNode1.nodeName === tNode2.nodeName ? 0 : 1; //cost of update
            for (let i = 1; i < size1; i++) {
                //deleting a single node has unit costs
                Dist[i][0] = Dist[i - 1][0] + tNode1.childNodes.item(i - 1).deleteTreeCost;
            }
            for (let j = 1; j < size2; j++) {
                //deleting a single node has unit costs
                Dist[0][j] = Dist[0][j - 1] + tNode2.childNodes.item(j - 1).insertTreeCost;
            }

            for (let i = 1; i < size1; i++) {
                for (let j = 1; j < size2; j++) {
                    //if both nodes have the same label and depth, we don't have the distance stays the same
                    Dist[i][j] = Math.min(
                        Dist[i - 1][j - 1] + editDistance(tNode1.childNodes.item(i - 1), tNode2.childNodes.item(j - 1)),
                        Dist[i - 1][j] + tNode1.childNodes.item(i - 1).deleteTreeCost, //deletion of preArr1[i] (unit cost)
                        Dist[i][j - 1] + tNode2.childNodes.item(j - 1).insertTreeCost//insertion of preArr2[j] (unit cost)
                    );
                }
            }
            return Dist[tNode1.childNodes.length][tNode2.childNodes.length];
        }

        const res = editDistance(xmlTree1, xmlTree2);
        console.log(res);
    }
}

exports.ComplexTreeDiff = ComplexTreeDiff;