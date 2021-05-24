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
const {Change} = require("../editscript/Change");
const {CPEEModel} = require("../CPEE/CPEEModel");
const {KyongHoMatching} = require("../matchings/KyongHoMatching");
const {TopDownMatching} = require("../matchings/TopDownMatching");
const {CPEENode} = require("../CPEE/CPEENode");
const {MatchDiff} = require("../diffs/MatchDiff");

class Merger {

    static merge(model1, model2) {
        const json = model1.root.convertToJson();

        //arbitrarily choose modelA as "old" model and modelB as "new" model to comppute edit script
        let editScript = MatchDiff.diff(model1, model2, TopDownMatching, KyongHoMatching);

        //reset first model
        model1 = new CPEEModel(CPEENode.parseFromJson(json));

        //apply edit script to first model until deletions
        let placeHolderCount = 0;
        for(const change of editScript.changes) {
            switch(change.changeType) {
                case Change.CHANGE_TYPES.INSERTION: {
                    const indexArr = change.newPath.split("/").map(str => parseInt(str));
                    //remove description index (always 0)
                    indexArr.splice(0, 1);

                    const childIndex = indexArr.pop();
                    const parent = Merger.findNode(model1, indexArr);
                    const child = CPEENode.parseFromJson(change.newNode);
                    parent.insertChild(child, childIndex);
                    child.changeType = change.changeType;
                    break;
                }
                case Change.CHANGE_TYPES.MOVE: {
                    //TODO deletions can mess with reshuffles
                    const nodeIndexArr = change.oldPath.split("/").map(str => parseInt(str));
                    //remove description index (always 0)
                    nodeIndexArr.splice(0, 1);
                    const node = Merger.findNode(model1, nodeIndexArr);
                    if(node.parent.placeholders === undefined) {
                        node.parent.placeholders = []
                    }
                    node.parent.placeholders.push(node.childIndex);
                    node.removeFromParent();

                    const parentIndexArr = change.newPath.split("/").map(str => parseInt(str));
                    //remove description index (always 0)
                    parentIndexArr.splice(0, 1);
                    const targetIndex = parentIndexArr.pop();

                    const parent = Merger.findNode(model1, parentIndexArr);

                    parent.insertChild(node, targetIndex);
                    node.changeType = change.changeType;
                    break;
                }
                case Change.CHANGE_TYPES.UPDATE: {
                    const nodeIndexArr = change.oldPath.split("/").map(str => parseInt(str));
                    //remove description index (always 0)
                    nodeIndexArr.splice(0, 1);
                    const node = Merger.findNode(model1, nodeIndexArr);
                    const newNode = CPEENode.parseFromJson(change.newNode);
                    for(const property in newNode) {
                        //preserve structural information
                        if(!property.startsWith("_")) {
                            node[property] = newNode[property]
                        }
                    }
                    node.changeType = change.changeType;
                    break;
                }
                case Change.CHANGE_TYPES.DELETION: {
                    const nodeIndexArr = change.oldPath.split("/").map(str => parseInt(str));
                    //remove description index (always 0)
                    nodeIndexArr.splice(0, 1);
                    const node = Merger.findNode(model1, nodeIndexArr);
                    //Don't actually delete the node, just mark it to verify consistency of model
                    node.changeType = change.changeType;
                }
            }
        }

        for(const node of model1.toPreOrderArray()) {
            if(node.changeType === "Insertion") {
                //TODO check for conflicting operation in vicinity
                for(const sibling of node.parent) {
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
        indexLoop: for(let index of indexArr) {
            //TODO replace this dirty fix for multiple deletions
            for (let i = 0; i < currNode.childNodes.length; i++) {
                const childNode = currNode.childNodes[i];
                if(childNode.changeType === "Deletion") index++;
                if(i === index) {
                    currNode = childNode;
                    continue indexLoop;
                }
            }
            throw new Error("Edit script not applicable to model");
        }
        return currNode;
    }
}

exports.Merger = Merger;
