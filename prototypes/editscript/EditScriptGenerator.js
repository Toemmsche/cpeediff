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

const {OperationEditScript, Change} = require("./OperationEditScript");
/**
 * Abstract super class for all edit scripts.
 * @abstract
 */
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
     * @return {OperationEditScript}
     */
    static generateEditScript(oldModel, newModel, matching, options = []) {
        const editScript = new OperationEditScript();
        const newToOldMap = matching.newToOldMap;
        const oldToNewMap = matching.oldToNewMap;

        const oldPostOrderArray = oldModel.toPostOrderArray();
        const newPreOrderArray = newModel.toPreOrderArray();
        
        //iterate in pre order through new model
        for (const newNode of newPreOrderArray) {
            //We can safely skip the root node, as it will always be mapped between two CPEE models
            if (newNode.parent == null) continue;
            const matchOfParent = newToOldMap.get(newNode.parent)[0];
            if (newToOldMap.has(newNode)) {
                //new Node has a match in the old model
                const match = newToOldMap.get(newNode)[0];
                let copied = false;

                //TODO fix copy (or not)
                /*
                if (oldToNewMap.get(match).length > 1) {
                    for (const copy of oldToNewMap.get(match)) {
                        //prevent duplicate copy operations
                        if (newPreOrderArray.indexOf(copy) < newPreOrderArray.indexOf(newNode)) {
                            editScript.changes.push(new Change(Change.typeEnum.COPY, copy, matchOfParent, newNode.childIndex))
                            const copyOfMatch = match.copy();
                            matchOfParent.insertChild(copyOfMatch, newNode.childIndex);
                            //create mapping for newly inserted copy
                            .set(newNode, [copyOfMatch]);
                            copied =  true;
                        }
                    }
                }
                 */

                if (!copied && !matchOfParent.nodeEquals(match.parent)) {
                    //move match to matchOfParent
                    editScript.changes.push(new Change(Change.typeEnum.MOVE, match, matchOfParent, newNode.childIndex));
                    match.removeFromParent();
                    matchOfParent.insertChild(match, newNode.childIndex);
                }

                if (!newNode.nodeEquals(match)) {
                    //relabel node
                    editScript.changes.push(new Change(Change.typeEnum.RELABEL, match, newNode, match.childIndex));
                    match.label = newNode.label;
                }
            } else {
                //perform insert operation at match of the parent node
                const copy = newNode.copy();
                matchOfParent.insertChild(copy, newNode.childIndex);
                //insertions are always mapped back to the original node
                newToOldMap.set(newNode, [copy]);
                editScript.changes.push(new Change(Change.typeEnum.INSERTION, copy, matchOfParent, newNode.childIndex));
            }
        }
        const oldDeletedNodes = [];
        for (const oldNode of oldPostOrderArray) {
            if (!oldToNewMap.has(oldNode)) {
                //delete node (old parent
                oldNode.removeFromParent();
                oldDeletedNodes.push(oldNode);
            }
        }
        //second pass to detect the largest subtrees that are fully deleted
        while(oldDeletedNodes.length > 0) {
            let node = oldDeletedNodes[0];
            //parent is also fully deleted
            while(node.parent !== null && oldDeletedNodes.includes(node.parent)) {
                node = node.parent;
            }
            //all nodes from index 0 to node are deleted in a single subtree deletion
            const subTreeSize = oldDeletedNodes.indexOf(node) + 1;
            if(subTreeSize > 1) {
                //subtree deletion
                editScript.changes.push(new Change(Change.typeEnum.SUBTREE_DELETION, node, node.parent, node.childIndex));
            } else {
                //leaf node deletion
                editScript.changes.push(new Change(Change.typeEnum.DELETION, node, node.parent, node.childIndex));
            }
            oldDeletedNodes.splice(0, subTreeSize);
        }

        //detect subtree insertions
        editScript.compress();
        return editScript;
    }
}

exports.EditScriptGenerator = EditScriptGenerator;