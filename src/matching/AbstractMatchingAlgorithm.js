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

const {CpeeModel} = require("../cpee/CpeeModel");

/**
 * Abstract super class for all matching algorithms.
 * @abstract
 */
class AbstractMatchingAlgorithm {
    /**
     * Additional options for the difference calculation
     * @type {String[]}
     */
    options;

    /**
     * Instantiate an AbstractMatchingAlgorithm object with the given options.
     * @throws {Error} If not called from within a subclass
     */
    constructor() {
        if (this.constructor === AbstractMatchingAlgorithm) {
            throw new Error("Instantiation of Abstract class 'AbstractDiff'");
        }

    }

    /**
     * Matches nodes in the two process models
     * @param {CpeeModel} oldModel The old process model
     * @param {CpeeModel} newModel The new process model
     * @param {Matching} existingMatching An existing matching that is extended.
     *                                    The order the matching algorithms are applied in matters.
     * @param comparator
     * @return {Matching} A matching containing a mapping of nodes from model1 to model2
     */
    static match(oldModel, newModel,existingMatching, comparator) {}
}

exports.AbstractMatchingAlgorithm = AbstractMatchingAlgorithm;