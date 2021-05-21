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

const {CPEEModel} = require("../CPEE/CPEEModel");

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
     * All the options available for this matching algorithm
     * @type {Object}
     */
    AVAILABLE_OPTIONS;

    /**
     * Instantiate an AbstractMatchingAlgorithm object with the given options.
     * @param {String[]} options Additional options for the matching algorithm
     * @param {String[]} availableOptions All the options avaiable for this matching algorithm
     * @throws {Error} If not called from within a subclass
     */
    constructor(options= [], availableOptions = []) {
        if (this.constructor === AbstractMatchingAlgorithm) {
            throw new Error("Instantiation of Abstract class 'AbstractDiff'");
        }
        this.AVAILABLE_OPTIONS = availableOptions;
        //validate options
        for(const option of options) {
            if(!this.AVAILABLE_OPTIONS.includes(option)) {
                throw Error("Unrecognized option " + option);
            }
        }
        this.options = options;
    }

    /**
     * Matches nodes in the two process models
     * @param {CPEEModel} oldModel The old process model
     * @param {CPEEModel} newModel The new process model
     * @param {Matching} existingMatching An existing matching that is extended.
     *                                    The order the matching algorithms are applied in matters.
     * @return {Matching} A matching containing a mapping of nodes from model1 to model2
     */
    static match(oldModel, newModel,existingMatching) {}
}

exports.AbstractMatchingAlgorithm = AbstractMatchingAlgorithm;