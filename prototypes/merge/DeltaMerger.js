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

        for(const node1 of dt1.toPreOrderArray()) {
            node1.label = "1_" + node1.label;
        }
        for(const node1 of dt2.toPreOrderArray()) {
            node1.label = "2_" + node1.label;
        }

        console.log(TreeStringSerializer.serializeDeltaTree(dt1));
        console.log(TreeStringSerializer.serializeDeltaTree(dt2));
        console.log("wd");

        for(const node1 of dt1.toPreOrderArray()) {
            //root is always matched
            if(node1.parent == null) continue;
            if(matching.hasOld(node1)) {
                const match2 = matching.getOldSingle(node1);

                if(matching.areMatched(node1.parent, match2.parent) ) {
                    console.log("True nil for " + node1.label);
                } else {
                    if(node1.isMove() && match2.isMove()) {
                        throw new Error("move conflict for " + node1.label);
                    } else {
                        if(node1.isNil() && match2.isMove()) {
                            //node was moved in T2 --> apply move to T1
                            const matchOfParent1 = matching.getNewSingle(match2.parent);
                            node1.removeFromParent();
                            matchOfParent1.insertChild(match2.childIndex, node1);
                        } else if(node1.isMove() && match2.isNil()) {
                            //node was moved in T1 --> apply move to T2
                            const matchOfParent2 = matching.getOldSingle(node1.parent);
                            match2.removeFromParent();
                            matchOfParent2.insertChild(node1.childIndex, match2);
                        } else {
                            throw new Error("impo");
                        }
                    }
                }
                
                if(node1.isUpdate() && match2.isUpdate()) {
                    throw new Error("Update on same node conflict");
                } else if( node1.isUpdate() && !match2.isUpdate()) {
                    //update match
                    for(const [key, val] of node1.attributes) {
                        match2.attributes.set(key, val);
                    }
                    match2.data = node1.data;
                    match2.updates = node1.updates;
                } else if(!node1.isUpdate() && match2.isUpdate()) {
                    //update node
                    for(const [key, val] of match2.attributes) {
                        node1.attributes.set(key, val);
                    }
                    node1.data = match2.data;
                    node1.updates = match2.updates;
                }
                
            } else {
                //node was either inserted in T1 and not in T2
                //OR
                //node was deleted in T2 but not in T1

                if(node1.isInsertion()) {
                    //node was inserted in T1 --> insert in T2
                    const copy = node1.copy(false);
                    const matchOfParent2 = matching.getOldSingle(node1.parent);
                    matchOfParent2.insertChild(node1.childIndex, copy);
                    matching.matchNew(copy, node1);
                } else  {
                    //node was either moved or kept in T1, but deleted in T2 --> delete in T1

                    //first, check for conflict with descendants
                    for(const descendant of node1.toPreOrderArray().slice(1)) {
                        if(descendant.isMove() || descendant.isInsertion() || descendant.isUpdate() || node1.isUpdate()) {
                            throw new Error("delete vs insertion or move or update conflict");
                        }
                    }
                    node1.removeFromParent();
                }
            }
        }

        //DT2
        for(const node2 of dt2.toPreOrderArray()) {
            //root is always matched
            if(node2.parent == null) continue;
            if(!matching.hasNew(node2)) {
                //node was either inserted in T2 and not in T1
                //OR
                //node was deleted in T1 but not in T2

                if(node2.isInsertion()) {
                    //node was inserted in T2 --> insert in T1
                    const copy = node2.copy(false);
                    const matchOfParent1 = matching.getNewSingle(node2.parent);
                    matchOfParent1.insertChild(node2.childIndex, copy);
                    matching.matchNew(node2, copy);
                } else  {
                    //node was either moved or kept in T2, but deleted in T1 --> delete in T2
                    //first, check for conflict with descendants
                    for(const descendant of node2.toPreOrderArray().slice(1)) {
                        if(descendant.isMove() || descendant.isInsertion() || descendant.isUpdate() || node2.isUpdate()) {
                            throw new Error("delete vs insertion or move or update conflict");
                        }
                    }
                    node2.removeFromParent();
                }
            }
        }

        console.log(TreeStringSerializer.serializeDeltaTree(dt2));
    }

}

exports.DeltaMerger = DeltaMerger;