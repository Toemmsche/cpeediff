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
const {CpeeModel} = require("../CPEE/CpeeModel");


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
    static match(oldModel, newModel, matching = new Matching(), t = 0.1) {
        const topDown = (oldNode, newNode) => {
            if (oldNode.compareTo(newNode) <= t) {
                matching.matchNew(newNode, oldNode);
                //If two nodes match exactly, we try to match their children recursively, too.
                //TODO don't map when keyword appears mukltiple times
                //That's it.
                for (const oldChild of oldNode) {
                    for (const newChild of newNode.childNodes) {
                        topDown(oldChild, newChild);
                    }
                }
            }
        }
        topDown(oldModel.root, newModel.root);
        return matching;
    }
}

exports.TopDownMatching = TopDownMatching;

