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

/**
 * Abstract super class for all diff algorithms.
 * @abstract
 */
class AbstractDiff {
    /**
     * The original process model
     * @type {CPEEModel}
     */
    model1;
    /**
     * The changed process model
     * @type {CPEEModel}
     */
    model2;
    /**
     * Additional options for the difference calculation
     * @type {String[]}
     */
    options;
    /**
     * All the options available for this diff algorithm
     * @type {Object}
     */
    AVAILABLE_OPTIONS;

    /**
     * Instantiate an AbstractDiff object with the given models and options.
     * @param {CPEEModel} model1 The original CPEE process model
     * @param {CPEEModel} model2 The changed CPEE process model
     * @param {String[]} options Additional options for the difference calculation
     * @throws {Error} If not called from within a subclass
     */
    constructor(model1, model2, options= [], availableOptions = []) {
        if (this.constructor === AbstractDiff) {
            throw new Error("Instantiation of Abstract class 'AbstractDiff'");
        }
        this.model1 = model1;
        this.model2 = model2;
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
     * Diffs the two CPEE process models.
     * @return {AbstractPatch} A patch containing a list of changes, grouped by operation
     */
    diff() {}
}

exports.AbstractDiff = AbstractDiff;