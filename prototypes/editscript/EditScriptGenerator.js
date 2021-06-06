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


const {Config} = require("../Config");
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
        for (const newNode of newPreOrderArray) {
            //We can safely skip the root node, as it will always be mapped between two CPEE models
            if (newNode.parent == null) continue;
            const matchOfParent = matching.getNewSingle(newNode.parent);
            if (matching.hasNew(newNode)) {
                //new Node has a match in the old model
                const match = matching.getNewSingle(newNode);
                //is a copy?
                const newMatches = matching.getOld(match);
                if (newMatches.size > 1) {
                    //determine which node is NIL and which ones are copies, the latter are unmatched
                    //TODO actually compute best NIL
                    for (const newMatch of newMatches) {
                        if (newMatch !== newNode) {
                            matching.unMatchNew(newMatch);
                        }
                    }
                }
                if (matchOfParent !== match.parent) {
                    const oldPath = match.toChildIndexPathString();
                    //move match to matchOfParent
                    match.removeFromParent();

                    //find appropriate insertion index
                    let insertionIndex;
                    if(newNode.childIndex > 0) {
                        const leftSibling = newNode.getSiblings()[newNode.childIndex - 1];
                        //left sibling has a match
                        insertionIndex = matching.getNewSingle(leftSibling).childIndex + 1;
                    } else {
                        insertionIndex = 0;
                    }

                    matchOfParent.insertChild(insertionIndex, match);
                    const newPath = match.toChildIndexPathString();
                    editScript.appendChange(Change.move(oldPath, newPath));
                }

                if (!newNode.contentEquals(match)) {
                    //modify node
                    const oldPath = match.toChildIndexPathString();
                    //lossy comparison
                    const oldData = new CpeeNode("");
                    const newData = new CpeeNode("");
                    if (newNode.data !== match.data) {
                        oldData.data = match.data;
                        newData.data = newNode.data;
                    }
                    //detected updated and inserted attributes
                    for (const [key, value] of newNode.attributes) {
                        if (match.attributes.has(key)) {
                            if (match.attributes.get(key) !== value) {
                                oldData.attributes.set(key, match.attributes.get(key));
                                newData.attributes.set(key, value);
                            }
                        } else {
                            oldData.attributes.set(key, null);
                            newData.attributes.set(key, value);
                        }
                    }
                    //detect deleted attributes
                    for (const [key, value] of match.attributes) {
                        if (!newNode.attributes.has(key)) {
                            oldData.attributes.set(key, value);
                            newData.attributes.set(key, null);
                        }
                    }

                    //during edit script generation, we don't need to update the data/attributes of the match
                    editScript.appendChange(Change.update(oldPath, oldData.convertToJson(false), newData.convertToJson(false)));
                }
            } else {
                //do not copy child nodes
                const copy = newNode.copy(false)

                //find appropriate insertion index
                let insertionIndex;
                if(newNode.childIndex > 0) {
                    const leftSibling = newNode.getSiblings()[newNode.childIndex - 1];
                    //left sibling has a match
                    insertionIndex = matching.getNewSingle(leftSibling).childIndex + 1;
                } else {
                    insertionIndex = 0;
                }

                //perform insert operation at match of the parent node
                matchOfParent.insertChild(insertionIndex, copy);
                const newPath = copy.toChildIndexPathString();
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
            const oldPath = node.toChildIndexPathString();
            //TODO document that removeFromParent() does not change the parent attributes
            node.removeFromParent();
            editScript.appendChange(Change.delete(oldPath));
        }

        //All nodes have the right parent and are matched or deleted later
        //However, order of child nodes might not be right, we must verify that it matches the new model.
        for (const oldNode of oldModel.toPreOrderArray()) {
            if (Config.EXACT_EDIT_SCRIPT || oldNode.hasInternalOrdering()) {
                //Based on A. Marian, "Detecting Changes in XML Documents", 2002

                const reshuffle = oldNode.childNodes.filter(n => matching.hasOld(n));
                if (reshuffle.length === 0) {
                    continue;
                }

                //map each old child node to the child index of its matching partner
                const arr = reshuffle.map(n => matching.getOldSingle(n).childIndex);

                //avoid expensive dynamic programming procedure if children are already ordered
                let ascending = true;
                for (let i = 1; i < arr.length; i++) {
                    if (arr[i] <= arr[i - 1]) {
                        ascending = false;
                        break;
                    }
                }
                if (ascending) {
                    continue;
                }

                //TODO
                //find conflict groups based on read and modified variables


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
                while (max !== -1) {
                    reshuffle.splice(max, 1);
                    max = parent[max];
                }

                for (const node of reshuffle) {
                    const match = matching.getOldSingle(node);
                    const oldPath = node.toChildIndexPathString();
                    node.changeChildIndex(match.childIndex);
                    const newPath = node.toChildIndexPathString();
                    editScript.appendChange(Change.move(oldPath, newPath));
                }
            }

        }

        /*
        //TODO fix

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
        return editScript;
    }


}

exports.EditScriptGenerator = EditScriptGenerator;