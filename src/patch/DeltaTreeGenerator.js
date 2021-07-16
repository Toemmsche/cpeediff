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

import {DeltaNodeFactory} from "../tree/DeltaNodeFactory.js";
import {Dsl} from "../Dsl.js";
import {IdExtractor} from "../match/extract/IdExtractor.js";
import {Update} from "../diff/delta/Update.js";

export class DeltaTreeGenerator {

    tree;
    moveMap;

    _handleInsert(change) {
        const indexArr = change.newPath.split("/").map(str => parseInt(str));
        const childIndex = indexArr.pop();
        const [parent, movfrParent] = this._findNode(indexArr.join("/"));
        const newNode = DeltaNodeFactory.getNode(change.newContent);

        this._applyInsert(parent, newNode, childIndex);
        if (movfrParent != null) {
            this._applyInsert(movfrParent, newNode, childIndex);
        }
    }

    _applyInsert(parent, node, childIndex) {
        const child = DeltaNodeFactory.getNode(node, true);
        parent.insertChild(childIndex, child);
        for (const descendant of child.toPreOrderArray()) {
            descendant.changeType = Dsl.CHANGE_TYPES.INSERTION.label
        }
    }

    _handleMove(change) {
        //find moved node
        let [node, movfrNode] = this._findNode(change.oldPath);

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
        const [parent] = this._findNode(parentIndexArr.join("/"));

        //insert node
        parent.insertChild(targetIndex, node);
        node.changeType = change.changeType;

        //Insert placeholder at old position
        movfrNode.changeType = Dsl.CHANGE_TYPES.MOVE_FROM;

        movfrParent.placeholders.push(movfrNode);
        //create entry in move map
        this.moveMap.set(node, movfrNode);
    }

    _handleUpdate(change) {
        const [node, movfrNode] = this._findNode(change.oldPath);
        const newContent = change.newContent;

        this._applyUpdate(node, newContent);
        if (movfrNode != null) {
            this._applyUpdate(movfrNode, newContent);
        }
    }

    _applyUpdate(node, newContent) {
        if (node.data !== newContent.data) {
            node.updates.set("data", new Update(node.data, newContent.data));
            node.data = newContent.data;
        }
        //detected updated and inserted attributes
        for (const [key, value] of newContent.attributes) {
            if (node.attributes.has(key)) {
                if (node.attributes.get(key) !== value) {
                    node.updates.set(key, new Update(node.attributes.get(key), value));
                    node.attributes.set(key, value);
                }
            } else {
                node.updates.set(key, new Update(null, value));
                node.attributes.set(key, value);
            }
        }

        //detect deleted attributes
        for (const [key, value] of node.attributes) {
            if (!newContent.attributes.has(key)) {
                node.updates.set(key, new Update(value, null))
                node.attributes.delete(key);
            }
        }
    }

    _handleDelete(change) {
        const [node, movfrNode] = this._findNode(change.oldPath);

        this._applyDelete(node);
        if (movfrNode != null) {
            this._applyDelete(movfrNode);
        }
    }

    _applyDelete(node) {
        for (const descendant of node.toPreOrderArray()) {
            descendant.changeType = Dsl.CHANGE_TYPES.DELETION.label
        }

        node.removeFromParent();
        node.parent.placeholders.push(node);
    }

    extendedDeltaTree(tree, editScript) {
        const deltaTree = this.deltaTree(this.tree, editScript)
        this._resolvePlaceholders(this.tree);
    }

    deltaTree(tree, editScript) {
        //copy this.tree
        tree = DeltaNodeFactory.getNode(tree);
        this.tree = tree;
        this.moveMap = new Map();

        const idExtractor = new IdExtractor();
        for (const node of this.tree.toPreOrderArray()) {
            node.baseNode = idExtractor.get(node);
        }

        for (const change of editScript) {
            switch (change.changeType) {
                case Dsl.CHANGE_TYPES.INSERTION.label: {
                    this._handleInsert(change);
                    break;
                }
                case Dsl.CHANGE_TYPES.MOVE_TO.label: {
                    this._handleMove(change);
                    break;
                }
                case Dsl.CHANGE_TYPES.UPDATE.label: {
                    this._handleUpdate(change);
                    break;
                }
                case Dsl.CHANGE_TYPES.DELETION.label: {
                    this._handleDelete(change);
                    break;
                }
            }
        }
        return this.tree;
    }


    _findNode(indexPath) {
        let currNode = this.tree;
        let moveFromPlaceHolder = null;
        if (indexPath !== "") {
            //remove root path "/"
            for (let index of indexPath.split("/").map(str => parseInt(str))) {
                if (index > currNode.numChildren()) {
                    throw new Error("Edit script not applicable to tree");
                }
                if (moveFromPlaceHolder != null) {
                    /*
                    if (index > moveFromPlaceHolder.numChildren()) {
                        throw new Error("Edit script not applicable to tree");
                    }
                    */
                    //TODO
                    moveFromPlaceHolder = moveFromPlaceHolder.getChild(index);
                }
                currNode = currNode.getChild(index);
                if (this.moveMap.has(currNode)) {
                    moveFromPlaceHolder = this.moveMap.get(currNode);
                }
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

