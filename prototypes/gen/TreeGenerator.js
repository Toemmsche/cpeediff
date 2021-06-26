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

const {Config} = require("../Config");
const {ModelFactory} = require("../factory/ModelFactory");
const {Preprocessor} = require("../parse/Preprocessor");
const {Dsl} = require("../Dsl");
const {CpeeModel} = require("../cpee/CpeeModel");
const {CpeeNode} = require("../cpee/CpeeNode");

class TreeGenerator {

    endpoints;
    labels;
    variables;

    maxSize;
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


        //at least 10 endpoints and labels
        this.endpoints = [];
        this.labels = [];
        this.variables = [];

        //about sqrt(n) variables, labels, and endpoints to choose from
        for (let i = 0; i < Math.max(Math.sqrt(this.maxSize), 10); i++) {
            this.endpoints.push(this._randomString(this._randInt(20) + 10));
            this.labels.push(this._randomString(this._randInt(20) + 10));
            this.variables.push(this._randomString(this._randInt(10) + 5));
        }

        const inners = new Set();
        const root = this._randomRoot();
        inners.add(root);
        let currSize = 1;
        while (currSize < this.maxSize) {
            let parent = this._randomFrom(inners);
            if(parent !== (parent = this._insertBetween(parent))) {
                currSize++;
                inners.add(parent);
            }

            let newNode;
            if (this._withProbability(0.6)) {
                newNode = this._randomLeaf();
                this._insertRandomly(parent, newNode);
            } else {
                newNode = this._randomInner();
                inners.add(newNode);
                this._insertRandomly(parent, newNode);
                if(newNode !== (newNode = this._insertBetween(newNode))) {
                    inners.add(newNode);
                    currSize++;
                }
                const newChild = this._randomLeaf();
                newNode.appendChild(newChild);
            }
            currSize += newNode.toPreOrderArray().length;
        }

        return new Preprocessor().prepareModel(new CpeeModel(root));
    }

    _insertBetween(parent) {
        if (parent.label === Dsl.KEYWORDS.PARALLEL.label) {
            const between = this._randomParallelBranch();
            this._insertRandomly(parent, between);
            return between;
        } else if (parent.label === Dsl.KEYWORDS.CHOOSE.label) {
            let between;
            if (this._withProbability(0.5) && !parent.childNodes.some(n => n.label === Dsl.KEYWORDS.OTHERWISE.label)) {
                between = this._randomOtherwise();
            } else {
                between = this._randomAlternative();
            }
            this._insertRandomly(parent, between);
            return between;
        }
        return parent;
    }

    _randomRoot() {
        return new CpeeNode(Dsl.KEYWORDS.ROOT.label);
    }

    _randomLeaf() {
        const rand = this._randInt(100);

        let node;
        //about two-third chance to add a call
        if (this._withProbability(0.7)) {
            node = this._randomCall();
        } else if (this._withProbability(0.8)) {
            node = this._randomManipulate();
        } else if (this._withProbability(0.3)) {
            node = this._randomStop();
        } else if (this._withProbability(0.3)) {
            node = this._randomEscape();
        } else {
            node = this._randomTerminate();
        }
        return node;
    }


    _randomInner() {
        //inner nodes are evenly distributed
        switch (this._randomFrom(Dsl.INNER_NODE_SET)) {
            case Dsl.KEYWORDS.LOOP.label:
                return this._randomLoop();
            case Dsl.KEYWORDS.CHOOSE.label:
                return this._randomChoose();
            case Dsl.KEYWORDS.PARALLEL.label:
                return this._randomParallel();
            case Dsl.KEYWORDS.CRITICAL.label:
                return this._randomCritical();
            default:
                return this._randomLoop();
        }
    }


    _randomCall() {
        const node = new CpeeNode(Dsl.KEYWORDS.CALL.label);
        node.attributes.set("endpoint", this._randomFrom(this.endpoints));

        const parameters = new CpeeNode("parameters");

        //random label
        const label = new CpeeNode("label");
        //TODO label shouldnt be random
        label.data = this._randomFrom(this.labels);
        parameters.appendChild(label);

        //random method
        const method = new CpeeNode("method");
        method.data = this._randomFrom(Dsl.ENDPOINT_METHODS);
        parameters.appendChild(method);

        //random arguments (read Variables)
        const args = new CpeeNode("arguments");
        for (const readVariable of this._randomSubSet(this.variables, this._randInt(this.maxVars))) {
            const arg = new CpeeNode(readVariable);
            arg.data = "data." + readVariable;
            args.appendChild(arg);
        }
        if(args.hasChildren()) {
            parameters.appendChild(args);
        }
        node.appendChild(parameters);

        //random modified Variables
        const code = new CpeeNode("code");
        const codeUpdate = new CpeeNode("update");
        codeUpdate.data = "";
        for (const modifiedVariable of this._randomSubSet(this.variables, this._randInt(this.maxVars))) {
            codeUpdate.data += "data." + modifiedVariable + " = 420;"
        }
        if(codeUpdate.data !== "") {
            code.appendChild(codeUpdate);
            node.appendChild(code);
        }

        return node;
    }

    _randomManipulate() {
        const node = new CpeeNode(Dsl.KEYWORDS.MANIPULATE.label);

        //random modified Variables
        node.data = "";
        for (const modifiedVariable of this._randomSubSet(this.variables, this._randInt(this.maxVars))) {
            node.data += "data." + modifiedVariable + " = 420;"
        }
        //TODO read variables

        return node;
    }

    _randomStop() {
        const node = new CpeeNode(Dsl.KEYWORDS.STOP.label);
        return node;
    }

    _randomEscape() {
        const node = new CpeeNode(Dsl.KEYWORDS.ESCAPE.label);
        return node;
    }

    _randomTerminate() {
        const node = new CpeeNode(Dsl.KEYWORDS.TERMINATE.label);
        return node;
    }

    _randomParallel() {
        const node = new CpeeNode(Dsl.KEYWORDS.PARALLEL.label);
        return node;
    }

    _randomParallelBranch() {
        const node = new CpeeNode(Dsl.KEYWORDS.PARALLEL_BRANCH.label);
        return node;
    }

    _randomChoose() {
        const node = new CpeeNode(Dsl.KEYWORDS.CHOOSE.label);
        node.attributes.set("mode", this._randomFrom(Dsl.CHOOSE_MODES));
        return node;
    }

    _randomAlternative() {
        const node = new CpeeNode(Dsl.KEYWORDS.ALTERNATIVE.label);

        //random condition
        const readVariable = this._randomFrom(this.variables);
        node.attributes.set("condition", "data." + readVariable + " < 69");

        return node;
    }

    _randomOtherwise() {
        const node = new CpeeNode(Dsl.KEYWORDS.OTHERWISE.label);
        return node;
    }

    _randomLoop() {
        const node = new CpeeNode(Dsl.KEYWORDS.LOOP.label);
        //random condition
        const readVariable = this._randomFrom(this.variables);
        node.attributes.set("condition", "data." + readVariable + " < 69");
        return node;
    }

    _randomCritical() {
        const node = new CpeeNode(Dsl.KEYWORDS.CRITICAL.label);
        return node;
    }


    _insertRandomly(parent, child) {
        let insertionIndex = this._randInt(parent.numChildren());
        if (parent.isRoot() && insertionIndex === 0) {
            insertionIndex++;
        }
        parent.insertChild(insertionIndex, child);
    }


    _randomFrom(collection) {
        if (collection.constructor === Set) {
            let i = 0;
            const randIndex = this._randInt(collection.size);
            for (const element of collection) {
                if (i === randIndex) return element;
                i++;
            }
        }
        if (collection.constructor === Array) {
            return collection[this._randInt(collection.length)];
        }
    }

    _randomSubSet(collection, amount) {
        const res = [];
        for (let i = 0; i < amount; i++) {
            res.push(this._randomFrom(collection));
        }
        return new Set(res);
    }

    _randInt(max) {
        return Math.floor(Math.random() * max);
    }

    _withProbability(prob) {
        return Math.random() < prob;
    }

    _randomString(length = this._randInt(100)) {
        const result = [];
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        for (let i = 0; i < length; i++) {
            result.push(characters.charAt(this._randInt(characters.length)));
        }
        return result.join('');
    }


    /*
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
            switch (this._randomFrom(Dsl.CHANGE_TYPE_SET)) {
                case Dsl.CHANGE_TYPES.SUBTREE_INSERTION: {
                    const newNode = this._randomInnerNode();
                    const parent = this._randomFrom(inners);
                    this.insertRandomly(parent, newNode);
                    insertionCounter++;
                    break;
                }
                case Dsl.CHANGE_TYPES.INSERTION: {
                    const newNode = this._randomLeafNode();
                    const parent = this._randomFrom(inners);
                    this.insertRandomly(parent, newNode);
                    insertionCounter++;
                    break;
                }
                case Dsl.CHANGE_TYPES.SUBTREE_DELETION: {
                    const node = this._randomFrom(inners);
                    node.removeFromParent();
                    deletionCounter++;
                    break;
                }
                case Dsl.CHANGE_TYPES.DELETION: {
                    const node = this._randomFrom(leaves);
                    node.removeFromParent();
                    deletionCounter++;
                    break;
                }
                case Dsl.CHANGE_TYPES.MOVE_TO:
                case Dsl.CHANGE_TYPES.MOVE_FROM: {
                    const node = this._randomFrom(nodes.filter(n => !n.isPropertyNode() && !n.isRoot()));
                    node.removeFromParent();
                    const newParent = this._randomFrom(model.innerNodes());
                    this.insertRandomly(newParent, node);
                    moveCounter++;
                    break;
                }
                case Dsl.CHANGE_TYPES.UPDATE: {
                    let node;
                    if (this.withProbability(0.8)) {
                        node = this._randomFrom(nodes);
                    } else {
                        node = this._randomFrom(inners);
                    }

                    if (node.data != null) {
                        this.data += this._randomString(10);
                    }

                    //randomly change/delete/insert attributes
                    for (const key of node.attributes.keys()) {
                        if (this.withProbability(0.05)) {
                            node.attributes.delete(key);
                        } else if (this.withProbability(0.15)) {
                            const newVal = node.attributes.get(key) + this._randomString(5);
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
        console.log("size: " + model.toPreOrderArray().length);
        return model;
    }

     */


}

exports.TreeGenerator = TreeGenerator;