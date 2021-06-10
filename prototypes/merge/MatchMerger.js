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


const {PathMatching} = require("../matching/PathMatching");

class MatchMerger {

    static merge(base, model1, model2) {
        base = base.copy();
        model1 = model1.copy();
        model2 = model2.copy();

        const baseTo1 = PathMatching.match(base, model1);
        const baseTo2 = PathMatching.match(base, model2);
        const model1To2 = PathMatching.match(model1, model2);

        for(const node1 of model1.toPreOrderArray()) {
            node1.label = "1_" + node1.label;
        }
        for(const node1 of model2.toPreOrderArray()) {
            node1.label = "2_" + node1.label;
        }
        for(const node1 of base.toPreOrderArray()) {
            node1.label = "base_" + node1.label;
        }

        //TODO match nodes that are matched in two, but not three


        //traverse model1
        for (const node1 of model1.toPreOrderArray()) {
            //root is always matched and merged
            if (node1.parent == null) continue;

            if (baseTo1.hasNew(node1) && model1To2.hasOld(node1)) {
                //either NIL or move
                const matchBase = baseTo1.getNewSingle(node1);
                const match2 = model1To2.getOldSingle(node1);

                const parent1 = node1.parent;
                const parentBase = matchBase.parent;
                const parent2 = match2.parent;

                if (baseTo1.getNewSingle(parent1) !== parentBase) {
                    //node was moved in T1
                    if (baseTo2.getNewSingle(parent2) !== parentBase) {
                        //node was also moved in T2
                        if (model1To2.getOldSingle(parent1) !== parent2) {
                            //node was moved to different places -> move conflict
                            throw new Error("move conflict with " + node1.label);
                        } else {
                            //T1 and T2 agree on this change, move node there
                            const newParentBase = baseTo1.getNewSingle(parent1);
                            matchBase.removeFromParent();
                            //TODO find right index
                            newParentBase.insertChild(node1.childIndex, matchBase);
                            console.log("applied shared move to base");
                        }
                    } else {
                        //node was not moved in T2 -> apply move from T1 to both trees
                        const newParentBase = baseTo1.getNewSingle(parent1);
                        matchBase.removeFromParent();
                        //TODO find right index
                        newParentBase.insertChild(node1.childIndex, matchBase);

                        const newParent2 = model1To2.getOldSingle(parent1);
                        match2.removeFromParent();
                        newParent2.insertChild(node1.childIndex, match2);
                        console.log("applied T1 move to both");
                    }
                } else if (model1To2.getOldSingle(parent1) !== parent2) {
                    //node was not moved in T1
                    //node was moved in T2 --> apply move from T2 during its traversal
                    console.log("delay move of T2");
                } else {
                    //node wasn't moved in either tree -> true NIL or update only
                    console.log(node1.label + " stays (NIL)");
                }
            } else if(baseTo1.hasNew(node1) && !model1To2.hasOld(node1)) {
                //node is in base and T1, but not in T2 --> node was deleted in T2, handle later
                console.log("delay deletion in T2");
            } else if(!baseTo1.hasNew(node1)) {
                //node was inserted
                if(model1To2.hasOld(node1)) {
                    //inserted in both, check parent
                    const parent1 = node1.parent;
                    const parent2 = model1To2.getOldSingle(node1).parent;
                    if(model1To2.hasOld(parent1) && model1To2.getOldSingle(parent1) === parent2) {
                        //nice insert
                        const parentBase = baseTo1.getNewSingle(parent1);
                        const copy = node1.copy(false);
                        parentBase.insertChild(node1.childIndex, copy);
                        console.log("applied shared insert to base");
                    }
                }
            }
        }
    }

}

exports.MatchMerger = MatchMerger;