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

import {EditOperation} from "./EditOperation.js";
import {Dsl} from "../Dsl.js";
import {NodeFactory} from "../tree/NodeFactory.js";
import {HashExtractor} from "../extract/HashExtractor.js";
import {Patcher} from "../patch/Patcher.js";

export class EditScript {

    _changes;
    cost;

    constructor() {
        this._changes = [];
        this.cost = 0;
    }

    toString() {
        return this._changes.map(c => c.toString()).join("\n");
    }
    
    addOperation(editOperation) {
        this._changes.push(editOperation);
    }

    insert(insertedNode) {
        this._changes.push(new EditOperation(Dsl.CHANGE_MODEL.INSERTION.label, null,
            insertedNode.xPath(), NodeFactory.getNode(insertedNode)));
        //TODO speed up
        this.cost += insertedNode.size();
    }

    delete(deletedNode) {
        this._changes.push(new EditOperation( Dsl.CHANGE_MODEL.DELETION.label, deletedNode.xPath(), null,  null));
        this.cost += deletedNode.size();
    }

    move(oldPath, newPath) {
        this._changes.push(new EditOperation(Dsl.CHANGE_MODEL.MOVE_TO.label, oldPath,  newPath));
        this.cost++;
    }

    update(updatedNode) {
        this._changes.push(new EditOperation(Dsl.CHANGE_MODEL.UPDATE.label, updatedNode.xPath(),
            null, NodeFactory.getNode(updatedNode, false)));
        const path = updatedNode.xPath();
        this.cost++;
    }

    totalChanges() {
        return this._changes.length;
    }

    insertions() {
        return this._changes.filter(c => c.type === Dsl.CHANGE_MODEL.INSERTION.label).length;
    }

    moves() {
        return this._changes.filter(c => c.type === Dsl.CHANGE_MODEL.MOVE_TO.label).length;
    }

    updates() {
        return this._changes.filter(c => c.type === Dsl.CHANGE_MODEL.UPDATE.label).length;
    }

    deletions() {
        return this._changes.filter(c => c.type === Dsl.CHANGE_MODEL.DELETION.label).length;
    }

    verify(oldTree, newTree) {
        const patchedTree = new Patcher().patch(oldTree, this);
        const hashExtractor = new HashExtractor();
        return hashExtractor.get(patchedTree) === hashExtractor.get(newTree);
    }

    /**
     *
     * @return {IterableIterator<EditOperation>} An iterator for the changes contained in this edit script.
     */
    [Symbol.iterator]() {
        return this._changes[Symbol.iterator]();
    }

}