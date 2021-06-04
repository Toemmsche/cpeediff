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

const {Placeholder} = require("../CPEE/Placeholder");
const {CpeeModel} = require("../CPEE/CpeeModel");
const {CpeeNode} = require("../CPEE/CpeeNode");
const {Change} = require("../editscript/Change");


class DeltaTreeGenerator {
    static deltaTree(model, editScript) {
        //copy model
        model = model.deltaCopy();
        let placeholderCount = 0;
        for (const change of editScript) {
            switch (change.changeType) {
                //Which path (new vs old) represents the anchor depends on the change operation
                case Change.CHANGE_TYPES.INSERTION: {
                    const indexArr = change.newPath.split("/").map(str => parseInt(str));
                    const childIndex = indexArr.pop();
                    const parent = findNodeByIndexArr(model, indexArr);
                    const child = CpeeNode.parseFromJson(change.newNode);
                    parent.insertChild(childIndex, child);
                    child.changeType = change.changeType;
                    break;
                }
                case Change.CHANGE_TYPES.MOVE: {
                    const nodeIndexArr = change.oldPath.split("/").map(str => parseInt(str));
                    const node = findNodeByIndexArr(model, nodeIndexArr);
                    node.removeFromParent();
                    //Insert placeholder at old position
                    if(node.parent.placeholders === undefined) {
                        node.parent.placeholders = [];
                    }
                    node.parent.placeholders.push(new Placeholder(placeholderCount, node.childIndex));
                    const parentIndexArr = change.newPath.split("/").map(str => parseInt(str));
                    const targetIndex = parentIndexArr.pop();
                    const parent = findNodeByIndexArr(model, parentIndexArr);
                    parent.insertChild(targetIndex, node);
                    //TODO move id
                    node.changeType = change.changeType;
                    break;
                }
                case Change.CHANGE_TYPES.UPDATE: {
                    const nodeIndexArr = change.oldPath.split("/").map(str => parseInt(str));
                    const node = findNodeByIndexArr(model, nodeIndexArr);
                    const newNode = CpeeNode.parseFromJson(change.newNode);
                    for (const property in newNode) {
                        //preserve structural information
                        if (!property.startsWith("_")) {
                            node[property] = newNode[property]
                        }
                    }
                    node.updated = true;
                    break;
                }
                case Change.CHANGE_TYPES.DELETION: {
                    const nodeIndexArr = change.oldPath.split("/").map(str => parseInt(str));
                    const node = findNodeByIndexArr(model, nodeIndexArr);
                    node.changeType = change.changeType;
                    //Do not actually delete the node, we want to show the delta
                }
            }
        }
        
        function findNodeByIndexArr(model, indexArr) {
            let currNode = model.root;
            indexLoop: for (let index of indexArr) {
                for (let i = 0; i < currNode.numChildren(); i++) {
                    if(currNode.getChild(i).changeType === Change.CHANGE_TYPES.DELETION) {
                        index++;
                    }
                    if(index === i) {
                        currNode = currNode.getChild(index);
                        continue indexLoop;
                    }
                }
                throw new Error("Edit script not applicable to model");
            }
            return currNode;
        }

        for(const oldNode of model.toPreOrderArray()) {
            if("placeholders" in oldNode) {
                //reverse placeholder array to preserve sibling order
                for(const placeholder of oldNode.placeholders.reverse()) {
                    oldNode.insertChild(placeholder.index, placeholder);
                }
                //avoid delete
               oldNode.placeholders = undefined;
            }
        }
        
        return model;
    }

}

exports.DeltaTreeGenerator = DeltaTreeGenerator;