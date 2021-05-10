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

const {AbstractMatchingAlgorithm} = require("./AbstractMatchingAlgorithm");
const {Matching} = require("./Matching");
const {CPEEModel} = require("../CPEE/CPEEModel");


class TopDownMatching extends AbstractMatchingAlgorithm {


    constructor(options = []) {
        super(options, []);
    }

    /**
     * Matches nodes based on a simple top-down approach.
     * @param {CPEEModel} oldModel The old process model
     * @param {CPEEModel} newModel The new process model
     * @param {Matching} existingMatching An existing matching that is extended.
     *                                    The order the matching algorithms are applied in matters.
     * @param {number} t The comparison threshold. A higher threshold will lead to more, but potentially wrong matches
     * @return {Matching} A matching containing a mapping of nodes from model1 to model2
     */
    static match(oldModel, newModel, existingMatching = new Matching(), t = 0.1) {
        //The two mappings from old to new and new told nodes respectively
        const oldToNewMap = existingMatching.newToOldMap;
        const newToOldMap = existingMatching.oldToNewMap;

        const topDown = (oldNode, newNode) => {
            if (oldNode.compareTo(newNode) <= t) {
                newToOldMap.set(newNode, [oldNode]);
                //If two nodes match exactly, we try to match their children recursively, too.
                //That's it.
                for (const oldChild of oldNode.childNodes) {
                    for (const newChild of newNode.childNodes) {
                        topDown(oldChild, newChild);
                    }
                }
            }
        }

        topDown(oldModel.root, newModel.root);
        for (const [newNode, matchArray] of newToOldMap) {
            const oldNode = matchArray[0];
            if (!oldToNewMap.has(oldNode)) {
                oldToNewMap.set(oldNode, []);
            }
            oldToNewMap.get(oldNode).push(newNode);
        }

        return new Matching(oldToNewMap, newToOldMap);
    }
}

exports.TopDownMatching = TopDownMatching;

