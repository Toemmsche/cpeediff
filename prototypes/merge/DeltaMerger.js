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


const {MergeNodeFactory} = require("../cpee/factory/MergeNodeFactory");
const {Matching} = require("../matching/Matching");
const {ChawatheMatching} = require("../matching/ChawatheMatch");
const {Dsl} = require("../Dsl");
const {TreeStringSerializer} = require("../serialize/TreeStringSerializer");
const {DeltaModelGenerator} = require("../patch/DeltaModelGenerator");
const {MatchDiff} = require("../diffs/MatchDiff");

class DeltaMerger {

    static merge(base, model1, model2) {
        const delta1 = MatchDiff.diff(base, model1, new ChawatheMatching());
        const delta2 = MatchDiff.diff(base, model2, new ChawatheMatching());
        console.log(delta1.convertToXml(false));
        console.log(delta2.convertToXml(false));

        const dt1 = DeltaModelGenerator.deltaTree(base, delta1).mergeCopy();
        const dt2 = DeltaModelGenerator.deltaTree(base, delta2).mergeCopy();

        const baseNodeMap = new Map();
        for(const node1 of dt1.toPreOrderArray()) {
            if(node1.baseNode != null) {
                baseNodeMap.set(node1.baseNode, node1);
            }

        }
        let matching = new Matching();
        for(const node2 of dt2.toPreOrderArray()) {
            if(node2.baseNode != null && baseNodeMap.has(node2.baseNode))   {
                matching.matchNew(node2, baseNodeMap.get(node2.baseNode));
            }
        }
        //find duplicate insertions
        matching = new ChawatheMatching().match(dt1, dt2, matching);

        for (const node of dt1.toPreOrderArray()) {
            node.changeOrigin = 1
        }
        for (const node2 of dt2.toPreOrderArray()) {
            node2.changeOrigin = 2;
        }

        console.log(TreeStringSerializer.serializeDeltaTree(dt1));
        console.log(TreeStringSerializer.serializeDeltaTree(dt2));

        const deleteConflicts           = new Set();
        const deleteDescendantConflicts = new Set();
        const updateConflicts           = new Set();
        const moveConflicts             = new Set();

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
                        const copy = MergeNodeFactory.getNode(node, false);
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
                                noConflict = false;
                            }
                        }
                        if(noConflict) {
                            node.removeFromParent();
                            deleteDescendantConflicts.delete(node);
                        }
                    }
                }
            }
        }

        function insertCorrectly(newParent, nodeToInsert, referenceNode) {
            //TODO consider order conflicts (mark nodes as newly inserted)
            //TODO find other way to assign nodes to tree
            nodeToInsert.changeOrigin = referenceNode.changeOrigin;
            nodeToInsert.changeType = referenceNode.changeType;
            let i = referenceNode.childIndex - 1;
            while (i >= 0 && (referenceNode.parent.getChild(i).isMove() || !matching.hasAny(referenceNode.parent.getChild(i)))) {
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

            //detect attribute and data conflicts
            for(const [key, change] of node.updates) {
                const oldVal = change[0];
                const newVal = change[1];
                    if(!match.updates.has(key)) {
                        match.updates.set(key, change.slice());
                        if(key === "data") {
                            match.data = newVal;
                        } else {
                            if(newVal == null) {
                                match.attributes.delete(key);
                            } else {
                                match.attributes.set(key, newVal);
                            }
                        }

                    } else {
                        const matchNewVal = match.updates.get(key)[1];
                        if(newVal !== matchNewVal) {
                            //TODO pick longer version
                            //true conflict, pick this tree's version
                            match.updates.get(key)[1] = newVal;
                            if(key === "data") {
                                match.data = newVal;
                            } else {
                                if(newVal == null) {
                                    match.attributes.delete(key);
                                } else {
                                    match.attributes.set(key, newVal);
                                }
                            }
                        }
                    }
            }

            //consider changes from other tree
            for(const [key, change] of match.updates) {
                const oldVal = change[0];
                const newVal = change[1];
                if(!node.updates.has(key)) {
                    node.updates.set(key, change.slice());
                    if(key === "data") {
                        node.data = newVal;
                    } else {
                        if(newVal == null) {
                            node.attributes.delete(key);
                        } else {
                            node.attributes.set(key, newVal);
                        }
                    }

                }
            }

            updateConflicts.delete(node);
            console.log("Resolved update on same node conflict");
        }

        for (const node of moveConflicts) {
            const match = matching.getOther(node);
            if(deleteDescendantConflicts.has(node)) {
               //favor T2
                const matchOfParent = matching.getOther(match.parent);
                node.removeFromParent();
                insertCorrectly(matchOfParent, node, match);
                moveConflicts.delete(node);
                deleteDescendantConflicts.delete(node);
            } else {
                //favor T1
                const matchOfParent = matching.getOther(node.parent);
                match.removeFromParent();
                insertCorrectly(matchOfParent, match, node);
                moveConflicts.delete(node);
            }

            console.log("Resolved move conflict in favor of T1");
        }

        for (const node of deleteConflicts) {
            //delete takes precedence
            node.removeFromParent();
            deleteDescendantConflicts.delete(node);
            console.log("Resolved delete conflict by deleting node");
        }

        //TODO bottom up traversal for deletion
        for (const node of deleteDescendantConflicts) {
            //delete the node
            for(const descendant of node.toPreOrderArray()) {
                //in the case of move, prefer old one
                if(descendant.isMove()) {
                    descendant.removeFromParent();
                    const match = matching.getOther(descendant);
                    const newParent = matching.getOther(match.parent);
                    insertCorrectly(newParent, descendant, match);
                }
            }
            node.removeFromParent();
        }

        //TODO resolve node order --> semantic aspects or anchors generated during delta construction
        for(const node of dt1.toPreOrderArray()) {
            if(node.hasInternalOrdering() && (node.isInsertion() || node.isMove())) {
                const leftSibling = node.getSiblings()[node.childIndex - 1];
                const rightSibling = node.getSiblings()[node.childIndex + 1];
                if(leftSibling != null  && (leftSibling.isMove() || leftSibling.isInsertion()) && leftSibling.changeOrigin !== node.changeOrigin) {
                    console.log("possible order conflict");
                }
                if(rightSibling != null && (rightSibling.isMove() || rightSibling.isInsertion()) && rightSibling.changeOrigin !== node.changeOrigin) {
                    console.log("possible order conflict");
                }
            }
        }

        console.log(dt1.convertToXml());
        console.log(dt2.convertToXml());
    }
}

exports.DeltaMerger = DeltaMerger;