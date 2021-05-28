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


const {Placeholder} = require("../CPEE/Placeholder");
const {Change} = require("./Change");
const {CpeeModel} = require("../CPEE/CpeeModel");
const {CpeeNode} = require("../CPEE/CpeeNode");
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
    static generateEditScript(oldModel, newModel, matching, options = []) {
        const editScript = new EditScript();

        const oldPostOrderArray = oldModel.toPostOrderArray();
        const newPreOrderArray = newModel.toPreOrderArray();

        //iterate in pre order through new model
        let placeholderCount = 0;
        for (const newNode of newPreOrderArray) {
            //We can safely skip the root node, as it will always be mapped between two CPEE models
            if (newNode.parent == null) continue;
            const matchOfParent = matching.getNewSingle(newNode.parent);
            if (matching.hasNew(newNode)) {
                //new Node has a match in the old model
                const match = matching.getNewSingle(newNode);
                if (matchOfParent !== match.parent) {
                    const oldPath = match.toString(CpeeNode.STRING_OPTIONS.CHILD_INDEX_ONLY);
                    //move match to matchOfParent
                    match.removeFromParent();
                    matchOfParent.insertChild(newNode.childIndex, match);
                    const newPath = match.toString(CpeeNode.STRING_OPTIONS.CHILD_INDEX_ONLY);
                    editScript.appendChange(Change.move(oldPath, newPath));
                }

                if (!newNode.nodeEquals(match)) {
                    //modify node
                    const oldPath = match.toString(CpeeNode.STRING_OPTIONS.CHILD_INDEX_ONLY);
                    const oldData = match.convertToJson();
                    const newData = newNode.convertToJson();
                    //TODO replace attributes
                    match.label = newNode.label;
                    editScript.appendChange(Change.update(oldPath, oldData, newData))
                }
            } else {
                //perform insert operation at match of the parent node
                const copy = newNode.copy()
                copy.childNodes = []; //reset child nodes
                matchOfParent.insertChild(newNode.childIndex, copy);
                const newPath = copy.toString(CpeeNode.STRING_OPTIONS.CHILD_INDEX_ONLY);
                const newData = copy.convertToJson();
                //insertions always correspond to a new mapping
                matching.matchNew(newNode, copy);
                editScript.appendChange(Change.insert(newPath, newData));
            }
        }
        const oldDeletedNodes = [];
        for (const oldNode of oldPostOrderArray) {
            if (!matching.hasOld(oldNode)) {
                //delete node
                //TODO document that removeFromParent() does not change the parent attributes
                oldNode.removeFromParent();
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
            const oldPath = node.toString(CpeeNode.STRING_OPTIONS.CHILD_INDEX_ONLY);
            editScript.appendChange(Change.delete(oldPath));
        }

        /*
        //TODO

        //detect subtree insertions
        for (let i = 0; i < editScript.changes.length; i++) {
            const change = editScript.changes[i];
            if (change instanceof Insertion) {
                const arr = change.targetNode.toPreOrderArray();
                //change type must remain the same (insertion or copy)
                for (let j = 1; j < arr.length; j++) {
                    if (i + j >= editScript.changes.length || !(editScript.changes[i + j] instanceof Insertion) || !editScript.changes[i + j].targetNode === arr[j]) {
                        break;
                    }
                    if (j === arr.length - 1) {
                        //replace whole subarray with single subtree insertion
                        editScript.changes.splice(i + 1, arr.length - 1);
                        editScript.changes[i] = new Insertion(change.targetNode, change.targetNode);
                    }
                }
            }
        }
        */


        //All nodes have the right path and are matched.
        //However, order of child nodes might not be right, we must verify that it matches the new model.
        for (const oldNode of oldModel.toPreOrderArray()) {
            if (oldNode.hasInternalOrdering() && oldNode.hasChildren()) {
                //Based on A. Marian, "Detecting Changes in XML Documents", 2002

                //map each old child node to the child index of its matching partner
                const arr = oldNode.childNodes.map(n => matching.getOldSingle(n).childIndex);

                //find the Longest Increasing Subsequence (LIS) and move every child that is not part of this sequence
                //dp[i] contains the length of the longest sequence that ends at i
                const dp = new Array(arr.length);
                const parent = new Array(arr.length);

                //best value
                let max = 0;
                //Simple O(n²) algorithm to compute the LIS
                for (let i = 0; i < dp.length; i++) {
                    dp[i] = 1;
                    parent[i] = -1;
                    for (let j = 0; j < i; j++) {
                        if (arr[j] < arr[i] && dp[j] + 1 > dp[i]) {
                            dp[i] = dp[j] + 1;
                            parent[i] = j;
                        }
                    }
                    //update best value
                    if (dp[i] > dp[max]) {
                        max = i;
                    }
                }
                //all nodes not part of the LIS have to be reordered
                const reshuffle = oldNode.childNodes.slice();
                while (max !== -1) {
                    reshuffle.splice(max, 1);
                    max = parent[max];
                }

                for (const node of reshuffle) {
                    const match = matching.getOldSingle(node);
                    const oldPath = node.toString(CpeeNode.STRING_OPTIONS.CHILD_INDEX_ONLY);
                    node.changeChildIndex(match.childIndex);
                    const newPath = node.toString(CpeeNode.STRING_OPTIONS.CHILD_INDEX_ONLY);
                    editScript.appendChange(Change.move(oldPath, newPath));
                }
            }
        }

        return editScript;
    }


}

exports.EditScriptGenerator = EditScriptGenerator;