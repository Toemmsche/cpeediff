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
    oldModel;
    /**
     * The changed process model
     * @type {CPEEModel}
     */
    newModel;

    /**
     * Instantiate an AbstractDiff object with the given models and options.
     * @param {CPEEModel} oldModel The original CPEE process model
     * @param {CPEEModel} newModel The changed CPEE process model
     * @param {String[]} options Additional options for the difference calculation
     * @param {String[]} availableOptions The options available for this diff algorithm.
     * @throws {Error} If not called from within a subclass
     */
    constructor(oldModel, newModel) {
        if (this.constructor === AbstractDiff) {
            throw new Error("Instantiation of Abstract class 'AbstractDiff'");
        }
        this.oldModel = oldModel;
        this.newModel = newModel;
    }

    /**
     * Diffs the two CPEE process models.
     * @return {UnifiedEditScript} A textual or graphical representation of an edit script that transforms
     *                              the old model into the new one
     */
    diff() {}
}

exports.AbstractDiff = AbstractDiff;