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


import {EditScript} from "./EditScript.js";
import {NodeFactory} from "../../tree/NodeFactory.js";
import {Config} from "../../Config.js";
import {Lis} from "../../lib/Lis.js";
import {Logger} from "../../../Logger.js";

export class EditScriptGenerator {

    _matching;
    _editScript;

    generateEditScript(oldTree, newTree, matching) {
        Logger.info("Generating edit script...", this);
        Logger.startTimed();
        this._matching = matching;
        this._editScript = new EditScript();

        const newPreOrderArray = newTree.toPreOrderArray();

        //iterate in pre order through new tree
        for (const newNode of newPreOrderArray) {
            //We can safely skip the root node, as it will always be mapped between two cpee trees
            if (newNode.parent == null) continue;
            if (matching.hasNew(newNode)) {
                //new Node has a match in the old tree
                const match = matching.getNew(newNode);
                if (matching.getNew(newNode.parent) !== match.parent) {
                    this._move(match);
                }
                if (!newNode.contentEquals(match)) {
                    this._update(match,);
                }
            } else {
                this._insert(newNode);
            }
        }

        const oldPreOrderArray = oldTree.toPreOrderArray();
        for (let i = 0; i < oldPreOrderArray.length; i++) {
            const oldNode = oldPreOrderArray[i];
            if (!matching.hasOld(oldNode)) {
                //skip all descendants in the post-order traversal
                i += oldNode.size() - 1;
                this._delete(oldNode);
            }
        }

        for (const newNode of newTree.toPreOrderArray()) {
            if (!matching.hasNew(newNode)) {
                throw new Error();
            }
        }
        for (const oldNode of oldTree.toPreOrderArray()) {
            if (!matching.hasOld(oldNode)) {
                throw new Error();
            }
        }

        //All nodes have the right parent and are matched or deleted later
        //However, order of child nodes might not be right, we must verify that it matches the new tree.
        for (const oldNode of oldTree.toPreOrderArray()) {
            if (Config.EXACT_EDIT_SCRIPT || oldNode.hasInternalOrdering()) {
                this._alignChildren(oldNode, this._editScript);
            }
        }

        Logger.stat("Edit script generation took " + Logger.endTimed() + "ms", this);
        Logger.stat("Cost of edit script: " + this._editScript.cost, this);
        return this._editScript;
    }

    _alignChildren(oldParent) {
        /*
         Map every node in the child node list to its matching partner's child index.
         Find the Longest Increasing Subsequence (LIS) amount the resulting array and move every child that is not part of this sequence.
         */
        const nodes = oldParent.children;
        const arr = nodes.map(n => this._matching.getOld(n).childIndex);
        let lis = Lis.getLis(arr);


        const inLis= new Set();
        for (const index of lis) {
            inLis.add(nodes[index]);
        }

        outer: for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            if(!inLis.has(node)) {
                /*
                 The node may be moved further back in the node list.
                 In order to also consider the following node, we must move the iteration index back.
                */
                i--;
                const oldPath = node.toChildIndexPathString();
                const thisMatchIndex = this._matching.getOld(node).childIndex;
                for (let j = 0; j < nodes.length; j++) {
                    const lisMatchIndex = this._matching.getOld(nodes[j]).childIndex;
                    if(inLis.has(nodes[j]) && lisMatchIndex > thisMatchIndex) {
                        //move within node list, adjust index for move further back
                        node.changeChildIndex(j > node.childIndex ? j - 1 : j);
                        const newPath = node.toChildIndexPathString();
                        this._editScript.move(oldPath, newPath);
                        inLis.add(node);
                        continue outer;
                    }
                }
                inLis.add(node);

                //move to end of node list
                node.changeChildIndex(nodes.length - 1);
                const newPath = node.toChildIndexPathString();
                this._editScript.move(oldPath, newPath);
                this._editScript.cost++;
            }
        }
    }

    _delete(oldNode) {
        const oldPath = oldNode.toChildIndexPathString();
        //TODO document that removeFromParent() does not change the parent attribute
        oldNode.removeFromParent();
        this._editScript.delete(oldPath, oldNode.hasChildren());

        this._editScript.cost += oldNode.size();
    }

    _move(oldNode) {
        const newNode = this._matching.getOld(oldNode);
        const oldPath = oldNode.toChildIndexPathString();

        //move oldNode to newParent
        oldNode.removeFromParent();

        //find appropriate insertion index
        const insertionIndex = this._findInsertionIndex(newNode);

        const newParent = this._matching.getNew(newNode.parent);
        newParent.insertChild(insertionIndex, oldNode);
        const newPath = oldNode.toChildIndexPathString();
        this._editScript.move(oldPath, newPath);

        this._editScript.cost++;
    }

    _insert(newNode) {
        const copy = NodeFactory.getNode(newNode, true);

        const deleteLater = [];
        const matchOrRemove = (copiedNode, newNode) => {
            if (this._matching.hasNew(newNode)) {
                deleteLater.push(copiedNode);
            } else {
                this._matching.matchNew(newNode, copiedNode);
                for (let i = 0; i < copiedNode.degree(); i++) {
                    matchOrRemove(copiedNode.getChild(i), newNode.getChild(i));
                }
            }
        }
        matchOrRemove(copy, newNode);
        for (const copiedNode of deleteLater) {
            copiedNode.removeFromParent();
        }

        //find appropriate insertion index
        const insertionIndex = this._findInsertionIndex(newNode);


        //perform insert operation at match of the parent node
        const newParent = this._matching.getNew(newNode.parent);
        newParent.insertChild(insertionIndex, copy);
        const newPath = copy.toChildIndexPathString();

        this._editScript.insert(newPath, NodeFactory.getNode(copy, true), copy.hasChildren());

        this._editScript.cost += copy.size();
    }

    _findInsertionIndex(newNode) {
        let insertionIndex;
        if (newNode.childIndex > 0) {
            const leftSibling = newNode.getSiblings()[newNode.childIndex - 1];
            //left sibling has a match
            insertionIndex = this._matching.getNew(leftSibling).childIndex + 1;
        } else {
            insertionIndex = 0;
        }
        return insertionIndex;
    }

    _update(oldNode) {
        const newNode = this._matching.getOld(oldNode);
        const oldPath = oldNode.toChildIndexPathString();
        //TODO possibnle minimal node update
        //during edit script generation, we don't need to update the data/attributes of the match
        this._editScript.update(oldPath, NodeFactory.getNode(newNode, false));

        this._editScript.cost++;
    }

    /**
     * Convert adjacent edits to sequence operations
     * @private
     */
    _postProcess() {
        //TODO
    }
}