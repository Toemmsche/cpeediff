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

const {TreeStringSerializer} = require("../serialize/TreeStringSerializer");
const {DeltaNode} = require("../CPEE/DeltaNode");
const {Placeholder} = require("../CPEE/Placeholder");
const {CpeeNode} = require("../CPEE/CpeeNode");
const {Change} = require("../editscript/Change");


class DeltaTreeGenerator {

    static deltaTree(model, editScript) {
        //copy model
        model = model.deltaCopy();

        let placeholderCount = 0;
        const moveMap = new Map();
        const placeholderMap = new Map();

        for (const change of editScript) {
            switch (change.changeType) {
                //Which path (new vs old) represents the anchor depends on the change operation
                case Change.CHANGE_TYPES.INSERTION: {
                    const indexArr = change.newPath.split("/").map(str => parseInt(str));
                    const childIndex = indexArr.pop();
                    const [parent, movfrParent] = findNodeByIndexArr(indexArr);
                    const child = DeltaNode.parseFromJson(change.newData);
                    child.changeType = change.changeType;
                    parent.insertChild(childIndex, child);

                    if (movfrParent !== null) {
                        const movfrChild = child.copy();
                        movfrParent.insertChild(childIndex, movfrChild);
                        movfrChild.changeType = change.changeType;
                    }

                    break;
                }
                case Change.CHANGE_TYPES.MOVE_TO: {

                    //find moved node
                    const nodeIndexArr = change.oldPath.split("/").map(str => parseInt(str));
                    let [node, movfrNode] = findNodeByIndexArr(nodeIndexArr);

                    //configure move_from placeholder node
                    let movfrParent;
                    if (movfrNode === null) {
                        movfrNode = node.copy();
                        movfrParent = node.parent;
                    } else {
                        movfrParent = movfrNode.parent;
                        movfrNode.removeFromParent();

                    }
                    //save index for placeholder
                    movfrNode.index = node.childIndex;

                    //detach node
                    node.removeFromParent();

                    //find new parent
                    const parentIndexArr = change.newPath.split("/").map(str => parseInt(str));
                    const targetIndex = parentIndexArr.pop();
                    const [parent] = findNodeByIndexArr(parentIndexArr);

                    //insert node
                    parent.insertChild(targetIndex, node);
                    node.changeType = change.changeType;

                    //TODO proper move id
                    //Insert placeholder at old position
                    movfrNode.label += " MOVE_FROM" + placeholderCount++;
                    movfrNode.changeType = Change.CHANGE_TYPES.MOVE_FROM;

                    movfrParent.placeholders.push(movfrNode);
                    //create entry in move map
                    moveMap.set(node, movfrNode);
                    break;
                }
                case Change.CHANGE_TYPES.UPDATE: {
                    const nodeIndexArr = change.oldPath.split("/").map(str => parseInt(str));
                    const [node, movfrNode] = findNodeByIndexArr(nodeIndexArr);
                    const newData = CpeeNode.parseFromJson(change.newData);

                    //update data and attributes
                    node.updates.push(["data", node.data, newData.data]);
                    node.data = newData.data;

                    if (newData.attributes !== undefined) {
                        for (const [key, value] of newData.attributes) {
                            node.updates.push([key, node.attributes.get(key), value]);
                            if (value === null) {
                                node.attributes.delete(key);
                            } else {
                                node.attributes.set(key, value);
                            }
                        }
                    }

                    if (movfrNode !== null) {
                        //update data and attributes
                        movfrNode.updates.push(["data", movfrNode.data, newData.data]);
                        movfrNode.data = newData.data;

                        if (newData.attributes !== undefined) {
                            for (const [key, value] of newData.attributes) {
                                movfrNode.updates.push([key, movfrNode.attributes.get(key), value]);
                                if (value === null) {
                                    movfrNode.attributes.delete(key);
                                } else {
                                    movfrNode.attributes.set(key, value);
                                }
                            }
                        }
                    }
                    break;
                }
                case Change.CHANGE_TYPES.DELETION: {
                    const nodeIndexArr = change.oldPath.split("/").map(str => parseInt(str));
                    const [node, movfrNode] = findNodeByIndexArr(nodeIndexArr);
                    for (const descendant of node.toPreOrderArray()) {
                        descendant.changeType = change.changeType;
                    }

                    node.removeFromParent();
                    node.parent.placeholders.push(node);

                    if (movfrNode !== null) {
                        for (const descendant of movfrNode.toPreOrderArray()) {
                            descendant.changeType = change.changeType;
                        }

                        movfrNode.removeFromParent();
                        movfrNode.parent.placeholders.push(movfrNode);
                    }
                    break;
                }
            }
        }

        function findNodeByIndexArr(indexArr) {
            let currNode = model.root;
            let moveFromPlaceHolder = null;
            for (let index of indexArr) {
                if (index > currNode.numChildren()) {
                    throw new Error("Edit script not applicable to model");
                }
                if (moveFromPlaceHolder !== null) {
                    moveFromPlaceHolder = moveFromPlaceHolder.getChild(index);
                }
                currNode = currNode.getChild(index);
                if (moveMap.has(currNode)) {
                    moveFromPlaceHolder = moveMap.get(currNode);
                }
            }
            return [currNode, moveFromPlaceHolder];
        }

        console.log(TreeStringSerializer.serializeModel(model));

        function resolvePlaceholders(node, isMoveTo = false) {
            for (const child of node) {
                resolvePlaceholders(child, isMoveTo || child.changeType === Change.CHANGE_TYPES.MOVE_TO);
            }
            for (const placeholder of node.placeholders) {
                resolvePlaceholders(placeholder, isMoveTo || node.changeType === Change.CHANGE_TYPES.MOVE_TO);
                if (!isMoveTo || !placeholder.changeType === Change.CHANGE_TYPES.MOVE_FROM) {
                    node.insertChild(placeholder.index, placeholder);
                }
            }
            node.placeholders = [];
        }

        resolvePlaceholders(model.root);
        return model;
    }

}

exports.DeltaTreeGenerator = DeltaTreeGenerator;