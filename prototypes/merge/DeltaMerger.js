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


const {Dsl} = require("../Dsl");
const {TreeStringSerializer} = require("../serialize/TreeStringSerializer");
const {DeltaModelGenerator} = require("../patch/DeltaModelGenerator");
const {MatchDiff} = require("../diffs/MatchDiff");
const {PathMatching} = require("../matching/PathMatching");

class DeltaMerger {


    static merge(base, model1, model2) {
        const delta1 = MatchDiff.diff(base, model1, PathMatching);
        const delta2 = MatchDiff.diff(base, model2, PathMatching);
        console.log(delta1.convertToXml(false));
        console.log(delta2.convertToXml(false));

        const dt1 = DeltaModelGenerator.deltaTree(base, delta1);
        const dt2 = DeltaModelGenerator.deltaTree(base, delta2);

        const matching = PathMatching.match(dt1, dt2);
        //TODO always match nodes that have been matched to the same node in base

        for (const node1 of dt1.toPreOrderArray()) {
            node1.label = "1_" + node1.label;
        }
        for (const node1 of dt2.toPreOrderArray()) {
            node1.label = "2_" + node1.label;
        }

        console.log(TreeStringSerializer.serializeDeltaTree(dt1));
        console.log(TreeStringSerializer.serializeDeltaTree(dt2));

        const deleteConflicts = new Set();
        const deleteDescendantConflicts = new Set();
        const updateConflicts = new Set();
        const moveConflicts = new Set();

        traverse(dt1);
        traverse(dt2);

        function traverse(deltaTree) {
            outer: for (const node of deltaTree.toPreOrderArray()) {
                if (node.parent == null) continue;
                if (matching.hasAny(node)) {
                    const match = matching.getOther(node);
                    if (matching.areMatched(node.parent, match.parent)) {
                        console.log("True nil for " + node.label);
                    } else if (node.isMove() && !match.isMove()) {
                        //node was moved in this tree, but not in the other one --> apply move to other tree
                        if (matching.hasAny(node.parent)) {
                            const matchOfParent = matching.getOther(node.parent);
                            match.removeFromParent();
                            insertCorrectly(matchOfParent, match, node);
                        } else {
                            console.log("undetected descendant delete conflict");
                        }
                    } else if (node.isMove() && match.isMove()) {
                        console.log("move conflict");
                        if (!moveConflicts.has(match)) {
                            moveConflicts.add(node);
                        }
                    }

                    if (node.isUpdate() && !match.isUpdate()) {
                        //update match
                        for (const [key, val] of node.attributes) {
                            match.attributes.set(key, val);
                        }
                        match.data = node.data;
                        match.updates = node.updates;
                    } else if (node.isUpdate() && match.isUpdate()) {
                        console.log("udpate conflict");
                        if (!updateConflicts.has(match)) {
                            updateConflicts.add(node);
                        }
                    }
                } else {
                    if (node.isInsertion()) {
                        //node was inserted in this Tree, not in the other --> insert in other tree
                        const copy = node.copy(false);
                        if (matching.hasAny(node.parent)) {
                            const matchOfParent = matching.getOther(node.parent);
                            insertCorrectly(matchOfParent, copy, node);
                            //TODO decide dynamically
                            if (dt1.toPreOrderArray().includes(node)) {
                                matching.matchNew(node, copy);
                            } else {
                                matching.matchNew(copy, node);
                            }
                        } else {
                            console.log("save for later..");
                        }
                    } else {
                        if (node.isMove() || node.isUpdate()) {
                            deleteConflicts.add(node);
                            continue outer;
                        }
                        //node was either moved or kept in this Tree, but deleted in the other --> delete in this tree, too
                        let noConflict = true;
                        for (const descendant of node.toPreOrderArray().slice(1)) {
                            if (descendant.isMove() || descendant.isInsertion() || descendant.isUpdate() || node.isUpdate()) {
                                deleteDescendantConflicts.add(node);
                                continue outer;
                            }
                        }
                        node.removeFromParent();
                        deleteDescendantConflicts.delete(node);
                    }
                }
            }
        }

        function insertCorrectly(newParent, nodeToInsert, referenceNode) {
            //TODO consider order conflicts (mark nodes as newly inserted)
            let i = referenceNode.childIndex - 1;
            while (i >= 0 && !matching.hasAny(referenceNode.parent.getChild(i))) {
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

        //resolve update conflicts
        for (const node of updateConflicts) {
            const match = matching.getOther(node);
            //TODO use updates provided in delta node (e.g. if something is changed to shorter value, it will be disregarded)
            //merge attributes
            for (const [key, value] of node.attributes) {
                if (!match.attributes.has(key) || match.attributes.get(key).length < value.length) {
                    match.attributes.set(key, value);
                }
            }
            for (const [key, value] of match.attributes) {
                if (!node.attributes.has(key) || node.attributes.get(key).length < value.length) {
                    node.attributes.set(key, value);
                }
            }
            //merge data
            if (node.data == null || match.data.length > node.data.length) {
                node.data = match.data;
            } else {
                match.data = node.data;
            }
            updateConflicts.delete(node);
            console.log("Resolved update on same node conflict");
        }

        for (const node of moveConflicts) {
            //use move 1
            const match = matching.getOther(node);
            const matchOfParent = matching.getOther(node.parent);
            match.removeFromParent();
            insertCorrectly(matchOfParent, match, node);
            moveConflicts.delete(node);
            console.log("Resolved move conflict in favor of T1");
        }

        for (const node of deleteConflicts) {
            //delete takes precedence
            node.removeFromParent();
            console.log("Resolved delete conflict by deleting node");
        }

        //TODO bottom up traversal for deletion
        for (const node of deleteDescendantConflicts) {
            //delete the node
            for(const descendant of node.toPreOrderArray()) {
                if(descendant.isMove()) {
                    descendant.removeFromParent();
                    const match  =matching.getOther(descendant);
                    const newParent = matching.getOther(match.parent);
                    insertCorrectly(newParent, descendant, match);
                }
            }

            node.removeFromParent();
        }

        //TODO match child nodes of insertion
        //TODO resolve node order --> semantic aspects

        console.log(dt1.root.convertToXml());
    }
}

exports.DeltaMerger = DeltaMerger;