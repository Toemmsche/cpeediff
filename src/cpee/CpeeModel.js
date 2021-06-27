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

const {CpeeNode} = require("./CpeeNode");

class CpeeModel {

    /**
     * @type CpeeNode
     */
    root;

    constructor(root) {
        this.root = root;
    }

    toPreOrderArray() {
        return this.root.toPreOrderArray();
    }

    toPostOrderArray() {
        return this.root.toPostOrderArray();
    }

    leafNodes() {
        return this.toPreOrderArray().filter(n => n.isLeaf());
    }

    innerNodes() {
        return this.toPreOrderArray().filter(n => !n.isLeaf() && !n.isPropertyNode());
    }

    nodes() {
        return this.toPreOrderArray().filter(n => !n.isPropertyNode());
    }

}

exports.CpeeModel = CpeeModel;