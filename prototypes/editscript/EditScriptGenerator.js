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


const {CpeeNodeFactory} = require("../cpee/factory/CpeeNodeFactory");
const {Lis} = require("../lib/Lis");
const {Config} = require("../Config");
const {Change} = require("./Change");
const {CpeeModel} = require("../cpee/CpeeModel");
const {CpeeNode} = require("../cpee/CpeeNode");
const {EditScript} = require("./EditScript");

class EditScriptGenerator {

    /**
     * Given a (partial) matching between the nodes of two process trees,
     * generates an edit script that includes (subtree) insert, (subree) delete and subtree move operations.
     * Based on the edit script algorithm by
     * Chawathe et al., "Change Detection in Hierarchically Structured Information"
     * @param oldModel
     * @param newModel
     * @param matching
     * @param options
     * @return {EditScript}
     */
    generateEditScript(oldModel, newModel, matching, options = []) {
        const editScript = new EditScript();

        const oldPostOrderArray = oldModel.toPostOrderArray();
        const newPreOrderArray = newModel.toPreOrderArray();

        //iterate in pre order through new model
        for (const newNode of newPreOrderArray) {
            //We can safely skip the root node, as it will always be mapped between two cpee models
            if (newNode.parent == null) continue;
            if (matching.hasNew(newNode)) {
                //new Node has a match in the old model
                const match = matching.getNew(newNode);
                if (matching.getNew(newNode.parent) !== match.parent) {
                    this._move(match, matching, editScript);
                }

                if (!newNode.contentEquals(match)) {
                    this._update(match, matching, editScript);
                }
            } else {
                //TODO subtree insert
                this._insert(newNode, matching, editScript);
            }
        }

        const oldDeletedNodes = [];
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

        //All nodes have the right parent and are matched or deleted later
        //However, order of child nodes might not be right, we must verify that it matches the new model.
        for (const oldNode of oldModel.toPreOrderArray()) {
            if (Config.EXACT_EDIT_SCRIPT || oldNode.hasInternalOrdering()) {
                this._alignChildren(oldNode, matching, editScript);
            }
        }
        return editScript;
    }

    _alignChildren(oldNode, matching, editScript) {
        //Based on A. Marian, "Detecting Changes in XML Documents", 2002

        const reshuffle = oldNode.childNodes.filter(n => matching.hasOld(n));
        if (reshuffle.length === 0) {
            return;
        }

        //map each old child node to the child index of its matching partner
        const arr = reshuffle.map(n => matching.getOld(n).childIndex);

        //avoid expensive dynamic programming procedure if children are already ordered
        let ascending = true;
        for (let i = 1; i < arr.length; i++) {
            if (arr[i] <= arr[i - 1]) {
                ascending = false;
                break;
            }
        }
        if (ascending) {
            return;
        }

        //TODO
        //find conflict groups based on read and modified variables
        //find the Longest Increasing Subsequence (LIS) and move every child that is not part of this sequence

        const lis = Lis.getLis(arr);

        //filter out LIS
        for (const index of lis) {
            reshuffle.splice(index, 1);
        }

        for (const node of reshuffle) {
            const match = matching.getOld(node);
            const oldPath = node.toChildIndexPathString();
            node.changeChildIndex(match.childIndex);
            const newPath = node.toChildIndexPathString();
            editScript.move(oldPath, newPath);
        }
    }

    _delete(oldNode, editScript) {
        const oldPath = oldNode.toChildIndexPathString();
        //TODO document that removeFromParent() does not change the parent attributes
        oldNode.removeFromParent();
        editScript.delete(oldPath, oldNode.hasChildren());
    }

    _move(oldNode, matching, editScript) {
        const newNode = matching.getOld(oldNode);
        const oldPath = oldNode.toChildIndexPathString();

        //move oldNode to newParent
        oldNode.removeFromParent();

        //find appropriate insertion index
        let insertionIndex;
        if (newNode.childIndex > 0) {
            const leftSibling = newNode.getSiblings()[newNode.childIndex - 1];
            //left sibling has a match
            insertionIndex = matching.getNew(leftSibling).childIndex + 1;
        } else {
            insertionIndex = 0;
        }

        const newParent = matching.getNew(newNode.parent);
        newParent.insertChild(insertionIndex, oldNode);
        const newPath = oldNode.toChildIndexPathString();
        editScript.move(oldPath, newPath);
    }

    _insert(newNode, matching, editScript) {
        //TODO refine to detect partial subrtrees
        //detect subtree insertions
        function noMatch(newNode) {
            if (matching.hasNew(newNode)) {
                return false;
            }
            for (const child of newNode) {
                if (!noMatch(child)) {
                    return false;
                }
            }
        }

        //if no descendant of newNode is matched, they all need to be inserted
        const copy = CpeeNodeFactory.getNode(newNode, noMatch(newNode));

        //find appropriate insertion index
        let insertionIndex;
        if (newNode.childIndex > 0) {
            const leftSibling = newNode.getSiblings()[newNode.childIndex - 1];
            //left sibling has a match
            insertionIndex = matching.getNew(leftSibling).childIndex + 1;
        } else {
            insertionIndex = 0;
        }

        //perform insert operation at match of the parent node
        const newParent = matching.getNew(newNode.parent);
        newParent.insertChild(insertionIndex, copy);
        const newPath = copy.toChildIndexPathString();

        //insertions always correspond to a new mapping
        matching.matchNew(newNode, copy);
        editScript.insert(newPath, CpeeNodeFactory.getNode(copy ,noMatch(newNode)), noMatch(newNode));
    }

    _update(oldNode, matching, editScript) {
        const newNode = matching.getOld(oldNode);
        const oldPath = oldNode.toChildIndexPathString();
        //during edit script generation, we don't need to update the data/attributes of the match
        editScript.update(oldPath, CpeeNodeFactory.getNode(newNode, false));
    }
}

exports.EditScriptGenerator = EditScriptGenerator;