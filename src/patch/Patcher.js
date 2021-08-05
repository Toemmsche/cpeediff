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

import {DeltaNodeFactory} from "./DeltaNodeFactory.js";
import {Dsl} from "../Dsl.js";
import {Update} from "../diff/Update.js";
import {NodeFactory} from "../tree/NodeFactory.js";
import {Logger} from "../../util/Logger.js";

export class Patcher {

    _tree;

    patch(tree, editScript) {
        //copy the tree
        this._tree = NodeFactory.getNode(tree);

        for (const change of editScript) {
            switch (change.type) {
                case Dsl.CHANGE_MODEL.INSERTION.label: {
                    this._handleInsert(change);
                    break;
                }
                case Dsl.CHANGE_MODEL.MOVE_TO.label: {
                    this._handleMove(change);
                    break;
                }
                case Dsl.CHANGE_MODEL.UPDATE.label: {
                    this._handleUpdate(change);
                    break;
                }
                case Dsl.CHANGE_MODEL.DELETION.label: {
                    this._handleDelete(change);
                    break;
                }
            }
        }
        Logger.debug("Inner moves: " + this.innerMoves + " leaf moves: " + this.leafMoves, this)
        return this._tree;
    }

    _findNode(indexPath) {
        let currNode = this._tree;
        if (indexPath !== "") {
            for (let index of indexPath.split("/").map(str => parseInt(str))) {
                if (index >= currNode.degree()) {
                    throw new Error("Edit script not applicable to tree");
                }
                currNode = currNode.getChild(index);
            }
        }
        return currNode;
    }


    innerMoves = 0;
    leafMoves = 0;

    _handleMove(change) {
        const movedNode = this._findNode(change.oldPath);
        movedNode.removeFromParent();

        if(movedNode.isLeaf()) {
            this.leafMoves++;
        } else {
            this.innerMoves++;
        }

        //Extract new child index
        const indexArr = change.newPath.split("/").map(str => parseInt(str));
        const childIndex = indexArr.pop();

        //Find parent node
        const targetParent = this._findNode(indexArr.join("/"));

       targetParent.insertChild(childIndex, movedNode);
    }


    _handleInsert(change) {
        //Extract new child index
        const indexArr = change.newPath.split("/").map(str => parseInt(str));
        const childIndex = indexArr.pop();

        //Find parent node
        const parent = this._findNode(indexArr.join("/"));

        //Insert
        const newNode = NodeFactory.getNode(change.newContent, true);
        parent.insertChild(childIndex, newNode);
    }

    _handleUpdate(change) {
        const node = this._findNode(change.oldPath);

        node.attributes = new Map();
        for(const [key, val] of change.newContent.attributes) {
            node.attributes.set(key,val);
        }
        node.text = change.newContent.text;
    }

    _handleDelete(change) {
        this._findNode(change.oldPath).removeFromParent();
    }

}

