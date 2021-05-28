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

const {CpeeModel} = require("../CPEE/CpeeModel");
const {CpeeNode} = require("../CPEE/CpeeNode");
const {Serializable} = require("../utils/Serializable");

class ModelGenerator {

    static INNER_NODES = ["parallel", "parallel_branch", "alternative", "otherwise", "critical", "loop", "choose"];
    static LEAF_NODES = ["call", "manipulate", "stop", "escape", "terminate"];

    size;
    maxDepth;
    maxWidth;
    numVars;

    constructor(size, maxDepth, maxWidth, numVars) {
        this.size = size;
        this.maxDepth = maxDepth;
        this.maxWidth = maxWidth;
        this.numVars = numVars;
    }

    //use prototype nodes

    randomModel() {
        const allInnerNodes = [new CpeeNode("description")];
        for (let i = 0; i < this.size; i++) {
            const parent = allInnerNodes[this.randInt(allInnerNodes.length)];
            const index = this.randInt(parent.numChildren())
            if (Math.random() >= 0.5) {
                const node = this.randomInnerNode();
                allInnerNodes.push(node);
                node.attributes.set("id", i);
                parent.insertChild(index, node);
            } else {
                const node = this.randomLeafNode();
                node.attributes.set("id", i);
                parent.insertChild(index, node);
            }
        }

        return new CpeeModel(allInnerNodes[0]);

        //TODO use empty node list and object.assign()


    }

    randomInnerNode() {
        const label = ModelGenerator.INNER_NODES[this.randInt(ModelGenerator.INNER_NODES.length)];
        return new CpeeNode(label);
    }

    randInt(max) {
        return Math.floor(Math.random() * max);
    }

    makeid(length) {
        const result = [];
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result.push(characters.charAt(Math.floor(Math.random() *
                charactersLength)));
        }
        return result.join('');
    }

    randomLeafNode() {
        const label = ModelGenerator.LEAF_NODES[this.randInt(ModelGenerator.LEAF_NODES.length)];
        const node = new CpeeNode(label);
        if (label === "call") {
            node.attributes.set("endpoint", this.makeid(this.randInt(this.numVars) + 1))
        }
        return node;
    };
}

exports.ModelGenerator = ModelGenerator;