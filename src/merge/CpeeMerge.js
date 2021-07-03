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

import {MatchPipeline} from "../matching/MatchPipeline.js";
import {StandardComparator} from "../compare/StandardComparator.js";
import {Matching} from "../matching/Matching.js";
import {MergeNodeFactory} from "../factory/MergeNodeFactory.js";
import {CpeeDiff} from "../diff/CpeeDiff.js";
import {DeltaTreeGenerator} from "../patch/DeltaModelGenerator.js";
import {Preprocessor} from "../parse/Preprocessor.js";
import {Update} from "../editscript/Update.js";

export class CpeeMerge {

    _getDeltaMatching(deltaTree1, deltaTree2) {
        const baseNodeMap = new Map();
        for (const node1 of deltaTree1.toPreOrderArray()) {
            if (node1.baseNode != null) {
                baseNodeMap.set(node1.baseNode, node1);
            }
        }
        let matching = new Matching();
        for (const node2 of deltaTree2.toPreOrderArray()) {
            if (node2.baseNode != null && baseNodeMap.has(node2.baseNode)) {
                matching.matchNew(node2, baseNodeMap.get(node2.baseNode));
            }
        }
        //find duplicate insertions
        return MatchPipeline.standard().execute(deltaTree1, deltaTree2, new StandardComparator(), matching);
    }

    _setChangeOrigin(deltaTree, origin) {
        for (const node of deltaTree.toPreOrderArray()) {
            node.changeOrigin = origin;
            for (const [key, update] of node.updates) {
                update.origin = origin;
            }
        }
    }

    _insertCorrectly(nodeToInsert, referenceNode, matching) {
        const newParent = matching.getOther(referenceNode.parent);
        nodeToInsert.changeOrigin = referenceNode.changeOrigin;
        nodeToInsert.changeType = referenceNode.changeType;
        let i = referenceNode.childIndex - 1;
        while (i >= 0 && (!matching.hasAny(referenceNode.parent.getChild(i)) || matching.getOther(referenceNode.parent.getChild(i)).parent !== newParent)) {
            i--;
        }
        if (i < 0) {
            newParent.insertChild(0, nodeToInsert);
        } else {
            const pre = referenceNode.parent.getChild(i);
            const match = matching.getOther(pre);
            newParent.insertChild(match.childIndex + 1, nodeToInsert);
        }
    }

    _applyUpdate(fromNode, toNode) {
        toNode.attributes = new Map();
        for (const [key, val] of fromNode.attributes) {
            toNode.attributes.set(key, val);
        }
        toNode.data = fromNode.data;
        for (const [updateKey, updateVal] of fromNode.updates) {
            toNode.updates.set(updateKey, updateVal.copy());
            toNode.updates.set(updateKey, updateVal.copy());
        }
    }

    _applyDeletions(deltaTree, matching) {
        for (const node of deltaTree.toPreOrderArray()) {
            if (!matching.hasAny(node) && !node.isInsertion()) {
                //no was deleted in other tree --> delete in this tree, too
                node.removeFromParent();
            }
        }
    }

    _applyMovesAndInsertions(deltaTree, matching) {
        for (const node of deltaTree.toPreOrderArray()) {
            if (node.parent == null) continue;
            if (matching.hasAny(node)) {
                const match = matching.getOther(node);
                if (node.isMove() && !match.isMove()) {
                    //node was moved in this tree, but not in the other one --> apply move to other tree
                    match.removeFromParent();
                    this._insertCorrectly(match, node, matching);
                }
                if (node.isUpdate() && !match.isUpdate() && !match.isInsertion()) {
                    //update match
                    //TODO check for insertion
                    this._applyUpdate(node, match);
                }


            } else {
                if (node.isInsertion()) {
                    //node was inserted in this Tree, not in the other --> insert in other tree
                    const copy = MergeNodeFactory.getNode(node, false);
                    this._insertCorrectly(copy, node, matching);
                    if (node.changeOrigin === 2) {
                        matching.matchNew(node, copy);
                    } else {
                        matching.matchNew(copy, node);
                    }
                }
            }
        }
    }

    _findConflicts(deltaTree, matching) {
        const updateConflicts = new Set();
        const moveConflicts = new Set();
        for (const node of deltaTree.toPreOrderArray()) {
            if (matching.hasAny(node)) {
                const match = matching.getOther(node);
                if (node.isMove() && match.isMove() && node.changeOrigin !== match.changeOrigin) {
                    moveConflicts.add(node);
                }
                if (node.isUpdate() && match.isUpdate()) {
                    updateConflicts.add(node);
                }

                //edge case: insertion of the same node (matched insertions) at different positions/with different content
                //TODO make merge case
                if (node.isInsertion() && (match.isInsertion() || match.isUpdate())) {
                    moveConflicts.add(node);
                    if (!node.contentEquals(match)) {
                        updateConflicts.add(node);
                    }
                }
            }
        }
        return [updateConflicts, moveConflicts];
    }

    _resolveMoveConflicts(moveConflicts, matching) {
        for (const node of moveConflicts) {
            const match = matching.getOther(node);
            if (matching.areMatched(node, match)) {
                //inter parent move
                node.confidence.positionConfident = false;
                match.confidence.positionConfident = false;
            } else {
                //far move (new parent)
                node.confidence.parentConfident = false;
                match.confidence.parentConfident = false;
            }
            //favor T1
            match.removeFromParent();
            this._insertCorrectly(match, node, matching);
        }
    }

    _resolveUpdateConflicts(updateConflicts, matching) {
        //resolve update conflicts
        for (const node of updateConflicts) {
            const match = matching.getOther(node);

            //edge case: a node is an insertion
            if (node.isInsertion()) {
                //insertion is essentially an update with no pre-existing value
                for (const [key, value] of node.attributes) {
                    node.updates.set(key, new Update(null, value, node.changeOrigin));
                }
                node.updates.set("data", new Update(null, node.data, node.changeOrigin));
            }

            if (match.isInsertion()) {
                //insertion is essentially an update with no pre-existing value
                for (const [key, value] of match.attributes) {
                    match.updates.set(key, new Update(null, value, match.changeOrigin));
                }
                match.updates.set("data", new Update(null, match.data, match.changeOrigin));
            }

            //detect attribute and data conflicts
            for (const [key, update] of node.updates) {
                const oldVal = update.oldVal;
                const newVal = update.newVal;
                if (!match.updates.has(key)) {
                    match.updates.set(key, update.copy());
                    if (key === "data") {
                        match.data = newVal;
                    } else if (newVal == null) {
                        match.attributes.delete(key);
                    } else {
                        match.attributes.set(key, newVal);
                    }
                } else {
                    const matchNewVal = match.updates.get(key).newVal;
                    if (newVal !== matchNewVal) {
                        //true conflict, pick longer version
                        if (matchNewVal == null || (newVal != null && newVal.length >= matchNewVal.length)) {
                            //adopt this version
                            match.updates.get(key).newVal = newVal;
                            match.updates.get(key).origin = update.origin;
                            if (key === "data") {
                                match.data = newVal;
                            } else {
                                match.attributes.set(key, newVal);
                            }
                        } else {
                            //adopt the version of the match
                            node.updates.get(key).newVal = matchNewVal;
                            node.updates.get(key).origin = match.updates.get(key).origin;
                            if (key === "data") {
                                node.data = matchNewVal;
                            } else {
                                node.attributes.set(key, matchNewVal);
                            }
                        }
                        //lose content confidence
                        node.confidence.contentConfident = false;
                        match.confidence.contentConfident = false;
                    }
                }
            }

            //consider non-conflicting updates from other node
            for (const [key, update] of match.updates) {
                const newVal = update.newVal;
                if (!node.updates.has(key)) {
                    node.updates.set(key, update.copy());
                    if (key === "data") {
                        node.data = newVal;
                    } else if (newVal == null) {
                        node.attributes.delete(key);
                    } else {
                        node.attributes.set(key, newVal);
                    }
                }
            }
        }
    }

    merge(base, tree1, tree2) {
        const differ = new CpeeDiff(MatchPipeline.standard());

        const delta1 = differ.diff(base, tree1, new StandardComparator());
        const delta2 = differ.diff(base, tree2, new StandardComparator());

        const deltaTreeFactory = new DeltaTreeGenerator();
        const dt1 = MergeNodeFactory.getNode(deltaTreeFactory.deltaTree(base, delta1));
        const dt2 = MergeNodeFactory.getNode(deltaTreeFactory.deltaTree(base, delta2));

        const matching = this._getDeltaMatching(dt1, dt2);

        this._setChangeOrigin(dt1, 1);
        this._setChangeOrigin(dt2, 2);

        this._applyDeletions(dt1, matching);
        this._applyDeletions(dt2, matching);
        this._applyDeletions(dt1, matching);

        const [updateConflicts, moveConflicts] = this._findConflicts(dt1, matching);

        this._applyMovesAndInsertions(dt1, matching);
        this._applyMovesAndInsertions(dt2, matching);

        this._resolveMoveConflicts(moveConflicts, matching);
        this._resolveUpdateConflicts(updateConflicts, matching);

        this._findOrderConflicts(dt1);
        this._findOrderConflicts(dt2);

        //trim tree
        return new Preprocessor().prepareTree(dt1);
    }

    _findOrderConflicts(deltaTree) {
        for (const node of deltaTree.toPreOrderArray()) {
            if (node.parent != null && node.parent.hasInternalOrdering() && (node.isInsertion() || node.isMove())) {
                const leftSibling = node.getSiblings()[node.childIndex - 1];
                const rightSibling = node.getSiblings()[node.childIndex + 1];
                if (leftSibling != null && (leftSibling.isMove() || leftSibling.isInsertion()) && leftSibling.changeOrigin !== node.changeOrigin) {
                    node.confidence.positionConfident = false;
                    leftSibling.confidence.positionConfident = false;
                }
                if (rightSibling != null && (rightSibling.isMove() || rightSibling.isInsertion()) && rightSibling.changeOrigin !== node.changeOrigin) {
                    node.confidence.positionConfident = false;
                    rightSibling.confidence.positionConfident = false;
                }
            }
        }
    }
}
