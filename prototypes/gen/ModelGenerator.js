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

const {ModelFactory} = require("../factory/ModelFactory");
const {Preprocessor} = require("../parse/Preprocessor");
const {Dsl} = require("../Dsl");
const {CpeeModel} = require("../cpee/CpeeModel");
const {CpeeNode} = require("../cpee/CpeeNode");

class ModelGenerator {

    static ENDPOINT_METHODS = [":get", ":post", ":put", ":patch", ":delete"];
    static CHOOSE_MODES = ["inclusive", "exclusive"];


    endpoints;
    labels;
    variables;

    maxDepth;
    maxWidth;
    maxVars;

    _currSize;
    _currDepth;

    constructor(maxSize, maxDepth, maxWidth, maxVars) {
        this.maxSize = maxSize;
        this.maxDepth = maxDepth;
        this.maxWidth = maxWidth;
        this.maxVars = maxVars;
    }

    randomModel() {
        this._currDepth = 0;
        this._currSize = 0;

        //at least 10 endpoints and labels
        this.endpoints = [];
        this.labels = [];
        this.variables = [];
        for (let i = 0; i < Math.max(Math.sqrt(this.maxSize), 10); i++) {
            this.endpoints.push(this.randomString(this.randInt(20) + 10));
            this.labels.push(this.randomString(this.randInt(20) + 10));
            this.variables.push(this.randomString(this.randInt(10) + 5));
        }

        return new Preprocessor().prepareModel(new CpeeModel(this.randomRoot()));
    }

    randomFrom(collection, amount = 1) {
        if (collection.constructor === Set) {
            let i = 0;
            const randIndex = this.randInt(collection.size);
            for (const element of collection) {
                if (i === randIndex) return element;
                i++;
            }
        }
        if (collection.constructor === Array) {
            return collection[this.randInt(collection.length)];
        }
    }

    randomSubSet(collection, amount) {
        const res = [];
        for (let i = 0; i < amount; i++) {
            res.push(this.randomFrom(collection));
        }
        return new Set(res);
    }

    randInt(max) {
        return Math.floor(Math.random() * max);
    }

    withProbability(prob) {
        return Math.random() < prob;
    }

    randomString(length = this.randInt(100)) {
        const result = [];
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        for (let i = 0; i < length; i++) {
            result.push(characters.charAt(this.randInt(characters.length)));
        }
        return result.join('');
    }

    insertRandomly(parent, child) {
        let insertionIndex = this.randInt(parent.numChildren());
        if (parent.isRoot() && insertionIndex === 0) {
            insertionIndex++;
        }
        parent.insertChild(insertionIndex, child);
    }

    randomNode() {
        this._currSize++;
        if (this._currSize >= this.maxSize || this.randInt(2) === 1 || Math.random() <= this._currDepth / this.maxDepth) {
            return this.randomLeafNode();
        } else {
            this._currDepth++;
            const node = this.randomInnerNode();
            this._currDepth--;
            return node;
        }
    }

    randomLeafNode() {
        const rand = this.randInt(100);

        //about two-third chance to add a call
        if (this.withProbability(0.7)) {
            return this.randomCall();
        } else if (this.withProbability(0.8)) {
            return this.randomManipulate();
        } else if (this.withProbability(0.3)) {
            return this.randomStop();
        } else if (this.withProbability(0.3)) {
            return this.randomEscape();
        } else {
            return this.randomTerminate();
        }
    }


    randomInnerNode() {
        //inner nodes are evenly distributed
        switch (this.randomFrom(Dsl.INNER_NODE_SET)) {
            case Dsl.KEYWORDS.LOOP.label:
                return this.randomLoop();
            case Dsl.KEYWORDS.CHOOSE.label:
                return this.randomChoose();
            case Dsl.KEYWORDS.PARALLEL.label:
                return this.randomParallel();
            case Dsl.KEYWORDS.CRITICAL.label:
                return this.randomCritical();
            default:
                return this.randomLoop();
        }
    }

    randomRoot() {
        const node = new CpeeNode(Dsl.KEYWORDS.ROOT.label);
        for (let i = 0; i < this.randInt(this.maxWidth); i++) {
            this.insertRandomly(node, this.randomNode());
        }
        return node;
    }

    randomCall() {
        const node = new CpeeNode(Dsl.KEYWORDS.CALL.label);
        node.attributes.set("endpoint", this.randomFrom(this.endpoints));

        const parameters = new CpeeNode("parameters");

        //random label
        const label = new CpeeNode("label");
        label.data = this.randomFrom(this.labels);
        parameters.appendChild(label);

        //random method
        const method = new CpeeNode("method");
        method.data = this.randomFrom(ModelGenerator.ENDPOINT_METHODS);
        parameters.appendChild(method);

        //random arguments (read Variables)
        const args = new CpeeNode("arguments");
        for (const readVariable of this.randomSubSet(this.variables, this.randInt(this.maxVars))) {
            const arg = new CpeeNode(readVariable);
            arg.data = "data." + readVariable;
            args.appendChild(arg);
        }
        parameters.appendChild(args);

        //random modified Variables
        const code = new CpeeNode("code");
        const codeUpdate = new CpeeNode("update");
        codeUpdate.data = "";
        for (const modifiedVariable of this.randomSubSet(this.variables, this.randInt(this.maxVars))) {
            codeUpdate.data += "data." + modifiedVariable + " = 420;"
        }
        code.appendChild(codeUpdate);

        node.appendChild(parameters);
        node.appendChild(code);

        return node;
    }

    randomManipulate() {
        const node = new CpeeNode(Dsl.KEYWORDS.MANIPULATE.label);

        //random modified Variables
        node.data = "";
        for (const modifiedVariable of this.randomSubSet(this.variables, this.randInt(this.maxVars))) {
            node.data += "data." + modifiedVariable + " = 420;"
        }

        return node;
    }

    randomStop() {
        const node = new CpeeNode(Dsl.KEYWORDS.STOP.label);
        return node;
    }

    randomEscape() {
        const node = new CpeeNode(Dsl.KEYWORDS.ESCAPE.label);
        return node;
    }

    randomTerminate() {
        const node = new CpeeNode(Dsl.KEYWORDS.TERMINATE.label);
        return node;
    }

    randomParallel() {
        const node = new CpeeNode(Dsl.KEYWORDS.PARALLEL.label);
        for (let i = 0; i < this.randInt(this.maxWidth); i++) {
            this.insertRandomly(node, this.randomParallelBranch());
        }
        return node;
    }

    randomParallelBranch() {
        this._currDepth++;
        const node = new CpeeNode(Dsl.KEYWORDS.PARALLEL_BRANCH.label);
        for (let i = 0; i < this.randInt(this.maxWidth); i++) {
            this.insertRandomly(node, this.randomNode());
        }
        this._currDepth--;
        return node;
    }

    randomChoose() {
        const node = new CpeeNode(Dsl.KEYWORDS.CHOOSE.label);
        node.attributes.set("mode", this.randomFrom(ModelGenerator.CHOOSE_MODES));

        let i;
        for (i = 0; i < this.randInt(this.maxWidth); i++) {
            this.insertRandomly(node, this.randomAlternative());
        }
        this.insertRandomly(node, this.randomOtherwise());

        return node;
    }

    randomAlternative() {
        this._currDepth++;
        const node = new CpeeNode(Dsl.KEYWORDS.ALTERNATIVE.label);

        //random condition
        const readVariable = this.randomFrom(this.variables);
        node.attributes.set("condition", "data." + readVariable + " < 69");

        for (let i = 0; i < this.randInt(this.maxWidth); i++) {
            this.insertRandomly(node, this.randomNode());
        }
        this._currDepth--;
        return node;
    }

    randomOtherwise() {
        this._currDepth++;
        const node = new CpeeNode(Dsl.KEYWORDS.OTHERWISE.label);
        for (let i = 0; i < this.randInt(this.maxWidth); i++) {
            this.insertRandomly(node, this.randomNode());
        }
        this._currDepth--;
        return node;
    }

    randomLoop() {
        const node = new CpeeNode(Dsl.KEYWORDS.LOOP.label);

        //random condition
        const readVariable = this.randomFrom(this.variables);
        node.attributes.set("condition", "data." + readVariable + " < 69");

        for (let i = 0; i < this.randInt(this.maxWidth); i++) {
            this.insertRandomly(node, this.randomNode());
        }
        return node;
    }

    randomCritical() {
        const node = new CpeeNode(Dsl.KEYWORDS.CRITICAL.label);
        for (let i = 0; i < this.randInt(this.maxWidth); i++) {
            this.insertRandomly(node, this.randomNode());
        }
        return node;
    }


    changeModel(model, maxChanges) {
        //do not modify original model
        model = ModelFactory.getModel(model);
        let insertionCounter = 0;
        let updateCounter = 0;
        let deletionCounter = 0;
        let moveCounter = 0;
        for (let i = 0; i < maxChanges; i++) {
            const nodes = model.toPreOrderArray();
            const inners = model.innerNodes();
            const leaves = model.leafNodes();

            //TODO prevent syntactical errors (like call directly underneath parallel or otherwise)
            switch (this.randomFrom(Dsl.CHANGE_TYPE_SET)) {
                case Dsl.CHANGE_TYPES.SUBTREE_INSERTION: {
                    const newNode = this.randomInnerNode();
                    const parent = this.randomFrom(inners);
                    this.insertRandomly(parent, newNode);
                    insertionCounter++;
                    break;
                }
                case Dsl.CHANGE_TYPES.INSERTION: {
                    const newNode = this.randomLeafNode();
                    const parent = this.randomFrom(inners);
                    this.insertRandomly(parent, newNode);
                    insertionCounter++;
                    break;
                }
                case Dsl.CHANGE_TYPES.SUBTREE_DELETION: {
                    const node = this.randomFrom(inners);
                    node.removeFromParent();
                    deletionCounter++;
                    break;
                }
                case Dsl.CHANGE_TYPES.DELETION: {
                    const node = this.randomFrom(nodes.filter(n => !n.isInnerNode()));
                    node.removeFromParent();
                    deletionCounter++;
                    break;
                }
                case Dsl.CHANGE_TYPES.MOVE_TO:
                case Dsl.CHANGE_TYPES.MOVE_FROM: {
                    const node = this.randomFrom(nodes.filter(n => !n.isPropertyNode() && !n.isRoot()));
                    node.removeFromParent();
                    const newParent = this.randomFrom(model.innerNodes());
                    this.insertRandomly(newParent, node);
                    moveCounter++;
                    break;
                }
                case Dsl.CHANGE_TYPES.UPDATE: {
                    let node;
                    if (this.withProbability(0.8)) {
                        node = this.randomFrom(nodes);
                    } else {
                        node = this.randomFrom(inners);
                    }

                    if (node.data != null) {
                        this.data += this.randomString(10);
                    }

                    //randomly change/delete/insert attributes
                    for (const key of node.attributes.keys()) {
                        if (this.withProbability(0.05)) {
                            node.attributes.delete(key);
                        } else if (this.withProbability(0.15)) {
                            const newVal = node.attributes.get(key) + this.randomString(5);
                            node.attributes.set(key, newVal);
                        }
                    }
                    updateCounter++;
                    break;
                }
            }
        }
        console.log("updates: " + updateCounter);
        console.log("insertions: " + insertionCounter);
        console.log("deletions: " + deletionCounter);
        console.log("moves: " + moveCounter);
        return model;
    }

}

exports.ModelGenerator = ModelGenerator;