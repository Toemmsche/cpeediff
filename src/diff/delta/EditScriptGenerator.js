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

export class EditScriptGenerator {

    matching;

    generateEditScript(oldTree, newTree, matching) {
        this.matching = matching;
        const editScript = new EditScript();

        const newPreOrderArray = newTree.toPreOrderArray();

        //iterate in pre order through new tree
        for (const newNode of newPreOrderArray) {
            //We can safely skip the root node, as it will always be mapped between two cpee trees
            if (newNode.parent == null) continue;
            if (matching.hasNew(newNode)) {
                //new Node has a match in the old tree
                const match = matching.getNew(newNode);
                if (matching.getNew(newNode.parent) !== match.parent) {
                    this._move(match, editScript);
                }
                if (!newNode.contentEquals(match)) {
                    this._update(match, editScript);
                }
            } else {
                this._insert(newNode, editScript);
            }
        }

        const oldDeletedNodes = [];
        const oldPostOrderArray = oldTree.toPostOrderArray();
        for (const oldNode of oldPostOrderArray) {
            if (!matching.hasOld(oldNode)) {
                //delete node
                oldDeletedNodes.push(oldNode);
            }
        }
        //second pass to detect the largest subtrees that are fully deleted
        while (oldDeletedNodes.length > 0) {
            let node = oldDeletedNodes[0];
            //parent is also fully deleted
            while (node.parent !== null && oldDeletedNodes.includes(node.parent)) {
                node = node.parent;
            }
            //all nodes from index 0 to node are deleted in a single subtree deletion
            const subTreeSize = oldDeletedNodes.indexOf(node) + 1;
            oldDeletedNodes.splice(0, subTreeSize);

            this._delete(node, editScript);
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
                this._alignChildren(oldNode, editScript);
            }
        }


        return editScript;
    }

    _alignChildren(oldParent, editScript) {
        /*
         Map every node in the child node list to its matching partner's child index.
         Find the Longest Increasing Subsequence (LIS) amount the resulting array and move every child that is not part of this sequence.
         */
        const nodes = oldParent.childNodes;
        const arr = nodes.map(n => this.matching.getOld(n).childIndex);
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
                const thisMatchIndex = this.matching.getOld(node).childIndex;
                for (let j = 0; j < nodes.length; j++) {
                    const lisMatchIndex = this.matching.getOld(nodes[j]).childIndex;
                    if(inLis.has(nodes[j]) && lisMatchIndex > thisMatchIndex) {
                        //move within node list
                        node.changeChildIndex(j);
                        const newPath = node.toChildIndexPathString();
                        editScript.move(oldPath, newPath);
                        inLis.add(node);
                        continue outer;
                    }
                }
                //move to end of node list
                node.changeChildIndex(nodes.length);
                const newPath = node.toChildIndexPathString();
                editScript.move(oldPath, newPath);
                inLis.add(node);
            }
        }
    }

    _delete(oldNode, editScript) {
        const oldPath = oldNode.toChildIndexPathString();
        //TODO document that removeFromParent() does not change the parent attributes
        oldNode.removeFromParent();
        editScript.delete(oldPath, oldNode.hasChildren());
    }

    _move(oldNode, editScript) {
        const newNode = this.matching.getOld(oldNode);
        const oldPath = oldNode.toChildIndexPathString();

        //move oldNode to newParent
        oldNode.removeFromParent();

        //find appropriate insertion index
        const insertionIndex = this._findInsertionIndex(newNode);

        const newParent = this.matching.getNew(newNode.parent);
        newParent.insertChild(insertionIndex, oldNode);
        const newPath = oldNode.toChildIndexPathString();
        editScript.move(oldPath, newPath);
    }

    _insert(newNode, editScript) {
        const copy = NodeFactory.getNode(newNode, true);

        const removeLater = [];
        const matchOrRemove = (copiedNode, newNode) => {
            if (this.matching.hasNew(newNode)) {
                removeLater.push(copiedNode);
            } else {
                this.matching.matchNew(newNode, copiedNode);
                for (let i = 0; i < copiedNode.numChildren(); i++) {
                    matchOrRemove(copiedNode.getChild(i), newNode.getChild(i));
                }
            }
        }
        matchOrRemove(copy, newNode);
        for (const copiedNode of removeLater) {
            copiedNode.removeFromParent();
        }

        //find appropriate insertion index
        const insertionIndex = this._findInsertionIndex(newNode);


        //perform insert operation at match of the parent node
        const newParent = this.matching.getNew(newNode.parent);
        newParent.insertChild(insertionIndex, copy);
        const newPath = copy.toChildIndexPathString();

        editScript.insert(newPath, NodeFactory.getNode(copy, true), copy.hasChildren());
    }

    _findInsertionIndex(newNode) {
        let insertionIndex;
        if (newNode.childIndex > 0) {
            const leftSibling = newNode.getSiblings()[newNode.childIndex - 1];
            //left sibling has a match
            insertionIndex = this.matching.getNew(leftSibling).childIndex + 1;
        } else {
            insertionIndex = 0;
        }
        return insertionIndex;
    }

    _update(oldNode, editScript) {
        const newNode = this.matching.getOld(oldNode);
        const oldPath = oldNode.toChildIndexPathString();
        //during edit script generation, we don't need to update the data/attributes of the match
        editScript.update(oldPath, NodeFactory.getNode(newNode, false));
    }
}