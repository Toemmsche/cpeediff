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

const {DeltaNodeFactory} = require("../cpee/factory/DeltaNodeFactory");
const {Dsl} = require("../Dsl");
const {TreeStringSerializer} = require("../serialize/TreeStringSerializer");
const {DeltaNode} = require("../cpee/DeltaNode");
const {CpeeNode} = require("../cpee/CpeeNode");

class DeltaModelGenerator {

    static deltaTree(model, editScript, extended = false) {
        //copy model
        model = model.deltaCopy();

        let placeholderCount = 0;
        const moveMap = new Map();

        for (const change of editScript) {
            switch (change.changeType) {
                //Which path (new vs old) represents the anchor depends on the change operation
                case Dsl.CHANGE_TYPES.SUBTREE_INSERTION:
                case Dsl.CHANGE_TYPES.INSERTION: {
                    const indexArr = change.newPath.split("/").map(str => parseInt(str));
                    const childIndex = indexArr.pop();
                    const [parent, movfrParent] = findNodeByIndexArr(indexArr);
                    const child = DeltaNodeFactory.getNode(change.newData, true);

                    parent.insertChild(childIndex, child);
                    for (const descendant of child.toPreOrderArray()) {
                        descendant.changeType = Dsl.CHANGE_TYPES.INSERTION;
                    }

                    if (movfrParent != null) {
                        const movfrChild =  DeltaNodeFactory.getNode(change.newData, true);
                        movfrParent.insertChild(childIndex, movfrChild);

                        for (const descendant of movfrChild.toPreOrderArray()) {
                            descendant.changeType = Dsl.CHANGE_TYPES.INSERTION;
                        }
                    }
                    break;
                }
                case Dsl.CHANGE_TYPES.MOVE_TO: {

                    //find moved node
                    const nodeIndexArr = change.oldPath.split("/").map(str => parseInt(str));
                    let [node, movfrNode] = findNodeByIndexArr(nodeIndexArr);

                    //configure move_from placeholder node
                    let movfrParent;
                    if (movfrNode == null) {
                        movfrNode = DeltaNodeFactory.getNode(node, true);
                        movfrNode._childIndex = node.childIndex;
                        movfrParent = node.parent;
                    } else {
                        movfrParent = movfrNode.parent;
                        movfrNode.removeFromParent();
                    }

                    //detach node
                    node.removeFromParent();

                    //find new parent
                    const parentIndexArr = change.newPath.split("/").map(str => parseInt(str));
                    const targetIndex = parentIndexArr.pop();
                    const [parent] = findNodeByIndexArr(parentIndexArr);

                    //insert node
                    parent.insertChild(targetIndex, node);
                    node.moveIndex = ++placeholderCount;
                    node.changeType = change.changeType;

                    //TODO proper move id
                    //Insert placeholder at old position
                    movfrNode.moveIndex = placeholderCount;
                    movfrNode.changeType = Dsl.CHANGE_TYPES.MOVE_FROM;

                    movfrParent.placeholders.push(movfrNode);
                    //create entry in move map
                    moveMap.set(node, movfrNode);
                    break;
                }
                case Dsl.CHANGE_TYPES.UPDATE: {
                    const nodeIndexArr = change.oldPath.split("/").map(str => parseInt(str));
                    const [node, movfrNode] = findNodeByIndexArr(nodeIndexArr);
                    const newData = change.newData;

                    if (node.data !== newData.data) {
                        node.updates.set("data",[ node.data, newData.data]);
                        node.data = newData.data;
                    }

                    //TODO remove duplicated code

                    //detected updated and inserted attributes
                    for (const [key, value] of newData.attributes) {
                        if (node.attributes.has(key)) {
                            if (node.attributes.get(key) !== value) {
                                node.updates.set(key, [node.attributes.get(key), value]);
                                node.attributes.set(key, value);
                            }
                        } else {
                            node.updates.set(key, [null, value]);
                            node.attributes.set(key, value);
                        }
                    }

                    //detect deleted attributes
                    for (const [key, value] of node.attributes) {
                        if (!newData.attributes.has(key)) {
                            node.updates.set(key, [value, null])
                            node.attributes.delete(key);
                        }
                    }

                    if (movfrNode != null) {
                        
                        if (movfrNode.data !== newData.data) {
                            movfrNode.updates.set("data", [movfrNode.data, newData.data]);
                            movfrNode.data = newData.data;
                        }
                        
                        //detected updated and inserted attributes
                        for (const [key, value] of newData.attributes) {
                            if (movfrNode.attributes.has(key)) {
                                if (movfrNode.attributes.get(key) !== value) {
                                    movfrNode.updates.set(key, [movfrNode.attributes.get(key), value]);
                                    movfrNode.attributes.set(key, value);
                                }
                            } else {
                                movfrNode.updates.set(key, [null, value]);
                                movfrNode.attributes.set(key, value);
                            }
                        }

                        //detect deleted attributes
                        for (const [key, value] of movfrNode.attributes) {
                            if (!newData.attributes.has(key)) {
                                movfrNode.updates.set(key, [value, null])
                                movfrNode.attributes.delete(key);
                            }
                        }
                    }
                    break;
                }
                case Dsl.CHANGE_TYPES.SUBTREE_DELETION:
                case Dsl.CHANGE_TYPES.DELETION: {
                    const nodeIndexArr = change.oldPath.split("/").map(str => parseInt(str));
                    const [node, movfrNode] = findNodeByIndexArr(nodeIndexArr);
                    for (const descendant of node.toPreOrderArray()) {
                        descendant.changeType = Dsl.CHANGE_TYPES.DELETION;
                    }

                    node.removeFromParent();
                    node.parent.placeholders.push(node);

                    if (movfrNode != null) {
                        for (const descendant of movfrNode.toPreOrderArray()) {
                            descendant.changeType = Dsl.CHANGE_TYPES.DELETION;
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

        if (extended) {
            function resolvePlaceholders(node, isMoveTo = false) {
                for (const child of node) {
                    resolvePlaceholders(child, isMoveTo || child.isMove());
                }
                while (node.placeholders.length > 0) {
                    const placeholder = node.placeholders.pop();
                    if (!isMoveTo || !placeholder.changeType === Dsl.CHANGE_TYPES.MOVE_FROM) {
                        node.insertChild(placeholder.childIndex, placeholder);
                    }
                }
            }

            resolvePlaceholders(model.root);
        } else {
            for (const deltaNode of model.toPreOrderArray()) {
                //remove all placeholders
                deltaNode.placeholders = [];
            }
        }

        return model;
    }
}

exports.DeltaModelGenerator = DeltaModelGenerator;