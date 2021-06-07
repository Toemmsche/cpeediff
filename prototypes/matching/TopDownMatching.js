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

const {Globals} = require("../Config");
const {AbstractMatchingAlgorithm} = require("./AbstractMatchingAlgorithm");
const {Matching} = require("./Matching");
const {CpeeModel} = require("../cpee/CpeeModel");


class TopDownMatching extends AbstractMatchingAlgorithm {


    constructor(options = []) {
        super(options, []);
    }

    /**
     * Matches nodes based on a simple top-down approach.
     * @param {CpeeModel} oldModel The old process model
     * @param {CpeeModel} newModel The new process model
     * @param {Matching} existingMatching An existing matching that is extended.
     *                                    The order the matching algorithms are applied in matters.
     * @param {number} t The comparison threshold. A higher threshold will lead to more, but potentially wrong matches
     * @return {Matching} A matching containing a mapping of nodes from model1 to model2
     */
    static match(oldModel, newModel, matching = new Matching(), comparator) {
        if(!matching.hasNew(newModel.root)) {
            matching.matchNew(newModel.root, oldModel.root);
        }

        for(const newNode of newModel.toPreOrderArray()) {
            if(matching.hasNew(newNode)) {
                topDown(newNode, matching.getNewSingle(newNode));
            }
        }

        return matching;

        function topDown(oldNode, newNode) {
            //If two nodes match exactly, we try to match their children recursively, too.
            //TODO efficiency
            //That's it.
            const oldOccurrenceMap = new Map();
            const newOccurrenceMap = new Map();
            for (const oldChild of oldNode) {
                if (!matching.hasOld(oldChild)) {
                    let oldVal = oldOccurrenceMap.get(oldChild.label);
                    if (oldVal === null || oldVal === undefined) {
                        oldVal = 0;
                    }
                    oldOccurrenceMap.set(oldChild.label, oldVal + 1);
                }
            }
            for (const newChild of newNode) {
                if (!matching.hasNew(newChild)) {
                    let oldVal = newOccurrenceMap.get(newChild.label);
                    if (oldVal === null || oldVal === undefined) {
                        oldVal = 0;
                    }
                    newOccurrenceMap.set(newChild.label, oldVal + 1);
                }
            }

            for (const oldChild of oldNode) {
                //only match nodes with unique labels in both parents
                if (matching.hasOld(oldChild) || oldOccurrenceMap.get(oldChild.label) > 1 || newOccurrenceMap.get(oldChild.label) > 1) {
                    continue;
                }
                for (const newChild of newNode) {
                    if (!matching.hasNew(newChild) && oldChild.compareTo(newChild) <= Globals.LEAF_SIMILARITY_THRESHOLD) {
                        matching.matchNew(newChild, oldChild)
                    }
                }
            }
        }
    }

}

exports.TopDownMatching = TopDownMatching;

