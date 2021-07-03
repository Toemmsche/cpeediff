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
import {NodeFactory} from "../factory/NodeFactory.js";
import {Config} from "../Config.js";

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
        //Based on A. Marian, "Detecting Changes in XML Documents", 2002

        const reshuffle = oldParent.childNodes.filter(n => this.matching.hasOld(n));
        if (reshuffle.length === 0) {
            return;
        }

        for (const newNode of this.matching.getOld(oldParent)) {
            const match = this.matching.getNew(newNode);
            if (match.childIndex !== newNode.childIndex) {
                const oldIndex = match.childIndex;
                const oldPath = match.toChildIndexPathString();
                match.changeChildIndex(newNode.childIndex);
                const newPath = match.toChildIndexPathString();
                const newIndex = match.childIndex;
                if (oldIndex === newIndex) {
                    throw new Error();
                }
                editScript.move(oldPath, newPath);
            }
        }

        /*
        //map each old child node to the child index of its matching partner
        const arr = reshuffle.map(n => matching.getOld(n).childIndex);

        //TODO
        //find conflict groups based on read and modified variables
        //find the Longest Increasing Subsequence (LIS) and move every child that is not part of this sequence


        let lis = Lis.getLis(arr);
        const indexMap = new Array(arr.length);
        for (let i = 0; i < indexMap.length; i++) {
            indexMap[i] = -1;
        }
        for (const i of lis) {
            indexMap[arr[i]] = i;
        }
        lis = lis.map(i => arr[i]);

        //filter out all nodes that are part of the LIS
        const needMove = [];
        for (let i = 0; i < arr.length; i++) {
            if (indexMap[i] === -1) {
                needMove.push(i);
            }
        }

        //TODO in onlogn with linked lists

        for (const index of needMove) {
            let j;
            for (j = 0; j < lis.length && lis[j] < index; j++) ;

            const oldNode = matching.getNew(matching.getOld(oldParent).getChild(index));
            const oldPath = oldNode.toChildIndexPathString();
            oldNode.changeChildIndex(j === lis.length ? oldParent.numChildren() - 1 : indexMap[lis[j]]);
            for (let i = 0; i < lis[j]; i++) {
                //update pointer values for lis elements
                if(indexMap[i] !== -1) {
                    indexMap[i]++;
                }
            }
            lis.splice(j, 0, index);
            indexMap[index] = oldNode.childIndex;
            const newPath = oldNode.toChildIndexPathString();
            editScript.move(oldPath, newPath);
        }

         */


        for (const node of oldParent) {
            if (!this.matching.hasOld(node) || this.matching.getOld(node) == null) {
                throw new Error();
            }
        }
        const order = oldParent.childNodes.map(n => this.matching.getOld(n).childIndex);
        for (let i = 0; i < order.length - 1; i++) {
            if (order[i] >= order[i + 1]) {
                throw new Error("children were not aligned");
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