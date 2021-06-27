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

const {CpeeModel} = require("../cpee/CpeeModel");
const {ModelFactory} = require("../factory/ModelFactory");
const {IdExtractor} = require("../extract/IdExtractor");
const {DeltaNodeFactory} = require("../factory/DeltaNodeFactory");
const {Dsl} = require("../Dsl");
const {TreeStringSerializer} = require("../visual/TreeStringSerializer");
const {DeltaNode} = require("../cpee/DeltaNode");
const {CpeeNode} = require("../cpee/CpeeNode");

class DeltaModelGenerator {

    _handleInsert(tree, change, moveMap) {
        const indexArr = change.newPath.split("/").map(str => parseInt(str));
        const childIndex = indexArr.pop();
        const [parent, movfrParent] = this._findNodeByIndexArr(tree, indexArr, moveMap);
        const newNode = DeltaNodeFactory.getNode(change.newData);

        this._applyInsert(parent, newNode, childIndex);
        if (movfrParent != null) {
          this._applyInsert(movfrParent, newNode, childIndex);
        }
    }

    _applyInsert(parent, node, childIndex) {
        const child = DeltaNodeFactory.getNode(node, true);
        parent.insertChild(childIndex, child);
        for (const descendant of child.toPreOrderArray()) {
            descendant.changeType = Dsl.CHANGE_TYPES.INSERTION;
        }
    }

    _handleMove(tree, change, moveMap) {
        //find moved node
        const nodeIndexArr = change.oldPath.split("/").map(str => parseInt(str));
        let [node, movfrNode] = this._findNodeByIndexArr(tree, nodeIndexArr, moveMap);

        //configure move_from placeholder node
        let movfrParent;
        const noMovfrNode = movfrNode == null;
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
        const [parent] = this._findNodeByIndexArr(tree, parentIndexArr, moveMap);

        //insert node
        parent.insertChild(targetIndex, node);
        node.changeType = change.changeType;

        //Insert placeholder at old position
        movfrNode.changeType = Dsl.CHANGE_TYPES.MOVE_FROM;

        movfrParent.placeholders.push(movfrNode);
        //create entry in move map
        moveMap.set(node, movfrNode);
    }

    _handleUpdate(tree, change, moveMap) {
        const nodeIndexArr = change.oldPath.split("/").map(str => parseInt(str));
        const [node, movfrNode] = this._findNodeByIndexArr(tree, nodeIndexArr, moveMap);
        const newData = change.newData;

        this._applyUpdate(node, newData);
        if (movfrNode != null) {
            this._applyUpdate(movfrNode, newData);
        }
    }

    _applyUpdate(node, newData) {
        if (node.data !== newData.data) {
            node.updates.set("data", [node.data, newData.data]);
            node.data = newData.data;
        }
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
    }

    _handleDelete(tree, change, moveMap) {
        const nodeIndexArr = change.oldPath.split("/").map(str => parseInt(str));
        const [node, movfrNode] = this._findNodeByIndexArr(tree, nodeIndexArr, moveMap);

        this._applyDelete(node);
        if (movfrNode != null) {
            this._applyDelete(movfrNode);
        }
    }

    _applyDelete(node) {
        for (const descendant of node.toPreOrderArray()) {
            descendant.changeType = Dsl.CHANGE_TYPES.DELETION;
        }

        node.removeFromParent();
        node.parent.placeholders.push(node);
    }

    extendedDeltaTree(tree, editScript) {
        const deltaTree = this.deltaTree(tree, editScript)
        this._resolvePlaceholders(tree.root);
    }

    deltaTree(tree, editScript) {
        //copy tree
        tree = new CpeeModel(DeltaNodeFactory.getNode(tree.root));

        const idExtractor = new IdExtractor();
        for(const node of tree.toPreOrderArray()) {
            node.baseNode = idExtractor.get(node);
        }

        const moveMap = new Map();
        for (const change of editScript) {
            switch (change.changeType) {
                case Dsl.CHANGE_TYPES.SUBTREE_INSERTION:
                case Dsl.CHANGE_TYPES.INSERTION: {
                    this._handleInsert(tree, change, moveMap);
                    break;
                }
                case Dsl.CHANGE_TYPES.MOVE_TO: {
                    this._handleMove(tree, change, moveMap);
                    break;
                }
                case Dsl.CHANGE_TYPES.UPDATE: {
                    this._handleUpdate(tree, change, moveMap);
                    break;
                }
                case Dsl.CHANGE_TYPES.SUBTREE_DELETION:
                case Dsl.CHANGE_TYPES.DELETION: {
                    this._handleDelete(tree, change, moveMap);
                    break;
                }
            }
        }
        return tree;
    }


    _findNodeByIndexArr(tree, indexArr, moveMap) {
        let currNode = tree.root;
        let moveFromPlaceHolder = null;
        for (let index of indexArr) {
            if (index > currNode.numChildren()) {
                throw new Error("Edit script not applicable to tree");
            }
            if (moveFromPlaceHolder != null) {
                if (index > moveFromPlaceHolder.numChildren()) {
                    throw new Error("Edit script not applicable to tree");
                }
                moveFromPlaceHolder = moveFromPlaceHolder.getChild(index);
            }
            currNode = currNode.getChild(index);
            if (moveMap.has(currNode)) {
                moveFromPlaceHolder = moveMap.get(currNode);
            }
        }
        return [currNode, moveFromPlaceHolder];
    }

    _resolvePlaceholders(node, isMoveTo = false) {
        for (const child of node) {
            this._resolvePlaceholders(child, isMoveTo || child.isMove());
        }
        while (node.placeholders.length > 0) {
            const placeholder = node.placeholders.pop();
            if (!isMoveTo || !placeholder.changeType === Dsl.CHANGE_TYPES.MOVE_FROM) {
                node.insertChild(placeholder.childIndex, placeholder);
            }
        }
    }
}

exports.DeltaModelGenerator = DeltaModelGenerator;