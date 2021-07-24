/*
    Copyright 2021 Tom Papke

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http=//www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

/**
 * A data object containing information about the confidence of a merge for a certain node.
 * @property {Boolean} contentConfident If the merge is confident about the content of a node.
 * @property {Boolean} parentConfident If the merge is confident about the parent node of a node.
 * @property {Boolean} positionConfident If the merge is confident about the position of a node within
 * the child list of its parent.
 */
export class Confidence {

    contentConfident;
    parentConfident;
    positionConfident;

    /**
     * Create a new confidence object.
     * @param {Boolean} contentConfident If the merge is confident about the content of a node.
     * @param {Boolean} parentConfident If the merge is confident about the parent node of a node.
     * @param {Boolean} positionConfident If the merge is confident about the position of a node within
     */
    constructor(contentConfident, parentConfident, positionConfident) {
        this.contentConfident = contentConfident;
        this.parentConfident = parentConfident;
        this.positionConfident = positionConfident;
    }
}


