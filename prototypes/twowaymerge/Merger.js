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

const fs = require("fs");
const {KyongHoMatching} = require("../matchings/KyongHoMatching");
const {TopDownMatching} = require("../matchings/TopDownMatching");
const {CPEENode} = require("../CPEE/CPEENode");
const {Reshuffle} = require("../editscript/change/Reshuffle");
const {Update} = require("../editscript/change/Update");
const {Move} = require("../editscript/change/Move");
const {Insertion} = require("../editscript/change/Insertion");
const {Deletion} = require("../editscript/change/Deletion");
const {CPEEModel} = require("../CPEE/CPEEModel");
const {MatchDiff} = require("../diffs/MatchDiff");

class Merger {

    static merge(model1, model2) {
        const json = model1.root.convertToJSON();

        //arbitrarily choose modelA as "old" model and modelB as "new" model to comppute edit script
        let editScript = MatchDiff.diff(model1, model2, TopDownMatching, KyongHoMatching);

        //reset first model
        model1 = new CPEEModel(CPEENode.parseFromJSON(json));

        //apply edit script to first model until deletions
        let placeHolderCount = 0;
        for(const change of editScript.changes) {
            switch(change.constructor) {
                case Insertion: {
                    const indexArr = change.targetPath.split("/").map(str => parseInt(str));
                    //remove description index (always 0)
                    indexArr.splice(0, 1);

                    const childIndex = indexArr.pop();
                    const parent = Merger.findNode(model1, indexArr);
                    const child = CPEENode.parseFromJSON(change.newNodeJSON);
                    parent.insertChild(child, childIndex);
                    child.changeType = "Insertion"
                    break;
                }
                case Move: {
                    const nodeIndexArr = change.oldPath.split("/").map(str => parseInt(str));
                    //remove description index (always 0)
                    nodeIndexArr.splice(0, 1);
                    const node = Merger.findNode(model1, nodeIndexArr);
                    if(node.parent.placeholders === undefined) {
                        node.parent.placeholders = []
                    }
                    node.parent.placeholders.push(node.childIndex);
                    node.removeFromParent();

                    const parentIndexArr = change.targetPath.split("/").map(str => parseInt(str));
                    //remove description index (always 0)
                    parentIndexArr.splice(0, 1);
                    const targetIndex = parentIndexArr.pop();

                    const parent = Merger.findNode(model1, parentIndexArr);

                    parent.insertChild(node, targetIndex);
                    node.changeType = "Move";
                    break;
                }
                case Update: {
                    const nodeIndexArr = change.targetPath.split("/").map(str => parseInt(str));
                    //remove description index (always 0)
                    nodeIndexArr.splice(0, 1);
                    const node = Merger.findNode(model1, nodeIndexArr);
                    const newNode = CPEENode.parseFromJSON(change.newData);
                    for(const property in newNode) {
                        //preserve structural information
                        if(!property.startsWith("_")) {
                            node[property] = newNode[property]
                        }
                    }
                    node.changeType = "Update";
                    break;
                }
                case Deletion: {
                    const nodeIndexArr = change.targetPath.split("/").map(str => parseInt(str));
                    //remove description index (always 0)
                    nodeIndexArr.splice(0, 1);
                    const node = Merger.findNode(model1, nodeIndexArr);
                    //Don't actually delete the node, just mark it to verify consistency of model
                    node.changeType = "Deletion";
                }

                //TODO reshuffles, ignore for now as they need to be updated anyways
            }
        }

        for(const node of model1.toPreOrderArray()) {
            if(node.changeType === "Insertion") {
                //TODO check for conflicting operation in vicinity
                for(const sibling of node.parent.childNodes) {
                    if(sibling.changeType === "Deletion") {
                        node.changeType = "CONFLICT Insertion";
                        sibling.changeType = "CONFLICT Deletion";
                    }
                }
            }
        }


        console.log(model1.toTreeString(CPEENode.STRING_OPTIONS.CHANGE));
    }

    static findNode(model, indexArr) {
        let currNode = model.root;
        for(const index of indexArr) {
            if(index >= currNode.childNodes.length) {
                throw new Error("Edit script not applicable to model");
            }
            currNode = currNode.childNodes[index];
        }
        return currNode;
    }
}

exports.Merger = Merger;
