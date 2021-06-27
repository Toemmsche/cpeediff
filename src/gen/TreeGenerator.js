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

const {GeneratorParameters} = require("./GeneratorParameters");
const {DiffTestInfo} = require("../../test/diffeval/DiffTestInfo");
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

    genParams;

    constructor(genParams) {
        this.genParams = genParams;
        //at least 10 endpoints and labels
        this.endpoints = [];
        this.labels = [];
        this.variables = [];

        //about sqrt(n) variables, labels, and endpoints to choose from
        for (let i = 0; i < Math.max(Math.sqrt(this.genParams.maxSize), 10); i++) {
            this.endpoints.push(this._randomString(this._randInt(20) + 10));
            this.labels.push(this._randomString(this._randInt(20) + 10));
            this.variables.push(this._randomString(this._randInt(10) + 5));
        }
    }

    randomModel(root = this._randomRoot()) {
        const inners = new Set();
        inners.add(root);
        let currSize = 1;
        while (currSize < this.genParams.maxSize) {
            let parent = this._randomFrom(inners);
            if (parent !== (parent = this._insertBetween(parent))) {
                currSize++;
                inners.add(parent);
            }

            let newNode;
            if (this._withProbability(0.6)) {
                newNode = this._randomLeaf();
                this._appendRandomly(parent, newNode);
            } else {
                newNode = this._randomInner();
                inners.add(newNode);
                this._appendRandomly(parent, newNode);
                if (newNode !== (newNode = this._insertBetween(newNode))) {
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

    randomLeavesOnly(root = this._randomRoot()) {
        let currSize = 1;
        while (currSize < this.genParams.maxSize) {
            const newNode = this._randomCall();
            this._appendRandomly(root, newNode);
            currSize += newNode.toPreOrderArray().length;
        }
        return new Preprocessor().prepareModel(new CpeeModel(root));
    }

    _insertBetween(parent) {
        if (parent.label === Dsl.KEYWORDS.PARALLEL.label) {
            const between = this._randomParallelBranch();
            this._appendRandomly(parent, between);
            return between;
        } else if (parent.label === Dsl.KEYWORDS.CHOOSE.label) {
            let between;
            if (this._withProbability(0.5) && !parent.childNodes.some(n => n.label === Dsl.KEYWORDS.OTHERWISE.label)) {
                between = this._randomOtherwise();
            } else {
                between = this._randomAlternative();
            }
            this._appendRandomly(parent, between);
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
        if (args.hasChildren()) {
            parameters.appendChild(args);
        }
        node.appendChild(parameters);

        //random modified Variables
        const code = new CpeeNode("code");
        const codeUpdate = new CpeeNode("update");
        codeUpdate.data = "";
        for (const modifiedVariable of this._randomSubSet(this.variables, this._randInt(this.genParams.maxVars))) {
            codeUpdate.data += "data." + modifiedVariable + " = 420;"
        }
        if (codeUpdate.data !== "") {
            code.appendChild(codeUpdate);
            node.appendChild(code);
        }

        return node;
    }

    _randomManipulate() {
        const node = new CpeeNode(Dsl.KEYWORDS.MANIPULATE.label);

        //random modified Variables
        node.data = "";
        for (const modifiedVariable of this._randomSubSet(this.variables, this._randInt(this.genParams.maxVars))) {
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


    _appendRandomly(parent, child) {
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


    changeModel(model, numChanges) {
        //do not modify original model
        model = ModelFactory.getModel(model);
        const oldSize = model.toPreOrderArray().length;
        let insertionCounter = 0;
        let updateCounter = 0;
        let deletionCounter = 0;
        let moveCounter = 0;
        for (let i = 0; i < numChanges; i++) {
            switch (this._randomFrom(Array.of(...Dsl.CHANGE_TYPE_SET).filter(c => c !== Dsl.CHANGE_TYPES.MOVE_FROM && c !== Dsl.CHANGE_TYPES.NIL))) {
                case Dsl.CHANGE_TYPES.SUBTREE_INSERTION: {
                    insertionCounter++;
                    this._insertSubtreeRandomly(model);
                    break;
                }
                case Dsl.CHANGE_TYPES.INSERTION: {
                    insertionCounter++;
                    this._insertLeafRandomly(model);
                    break;
                }
                case Dsl.CHANGE_TYPES.SUBTREE_DELETION: {
                    deletionCounter++;
                    this._deleteSubtreeRandomly(model);
                    break;
                }
                case Dsl.CHANGE_TYPES.DELETION: {
                    deletionCounter++;
                    this._deleteLeafRandomly(model);
                    break;
                }
                case Dsl.CHANGE_TYPES.MOVE_TO:
                case Dsl.CHANGE_TYPES.MOVE_FROM: {
                    moveCounter++;
                    if (this._moveRandomly(model)) {
                        insertionCounter++;
                    }
                    break;
                }
                case Dsl.CHANGE_TYPES.UPDATE: {
                    updateCounter++;
                    this._updateRandomly(model);
                    break;
                }
            }
        }
        return {
            model: new Preprocessor().prepareModel(model),
            info: new DiffTestInfo(null, Math.max(oldSize, model.toPreOrderArray().length), insertionCounter, moveCounter, updateCounter, deletionCounter)
        };

    }

    _insertSubtreeRandomly(model) {
        const currSize = model.toPreOrderArray().length;

        let parent = this._randomFrom(model.innerNodes());
        parent = this._insertBetween(parent)

        let newNode = this._randomInner();
        this._appendRandomly(parent, newNode);
        newNode = this._insertBetween(newNode);

        //construct new model with less nodes
        //store old max size value
        const oldMaxSize = this.genParams.maxSize;
        this.genParams.maxSize = Math.max(Math.sqrt(oldMaxSize), 5);
        //construct random subtree around the new inner node
        this.randomModel(newNode);
        //restore old max size
        this.genParams.maxSize = oldMaxSize;

        const newSize = model.toPreOrderArray().length;
        if (model.toPreOrderArray().length <= currSize) {
            throw new Error();
        }
    }


    _insertLeafRandomly(model) {
        const currSize = model.toPreOrderArray().length;


        let parent = this._randomFrom(model.innerNodes());
        parent = this._insertBetween(parent)

        const newNode = this._randomLeaf();
        this._appendRandomly(parent, newNode);

        if (model.toPreOrderArray().length <= currSize) {
            throw new Error();
        }
    }

    _deleteSubtreeRandomly(model) {
        const node = this._randomFrom(model.innerNodes().filter(n => !n.isRoot()));
        if (node != null) {
            node.removeFromParent();
        }

    }

    _deleteLeafRandomly(model) {
        const node = this._randomFrom(model.leafNodes());
        if (node != null) {
            node.removeFromParent();
        }
    }

    _moveRandomly(model) {
        let increaseInsertionCounter = false;
        let parent = this._randomFrom(model.innerNodes());
        parent = this._insertBetween(parent);
        if (parent !== (parent = this._insertBetween(parent))) {
            increaseInsertionCounter = true;
        }
        let movedNode = this._randomFrom(model.nodes()
            .filter(n => !n.isRoot()
                && n.label !== Dsl.KEYWORDS.PARALLEL_BRANCH.label
                && n.label !== Dsl.KEYWORDS.CHOOSE.label));
        movedNode.removeFromParent();
        this._appendRandomly(parent, movedNode);
        return increaseInsertionCounter;
    }

    _updateRandomly(model) {
        let node;
        if (this._withProbability(0.6)) {
            node = this._randomFrom(model.toPreOrderArray().filter(n => n.data !== null));
            //if node has data, there's a 50% chance we alter this data and return
            node.data += this._randomString(10);
        } else {
            node = this._randomFrom(model.nodes().filter(n => n.hasAttributes()));
            const changedAttributeKey = this._randomFrom(Array.of(...node.attributes.keys()));
            //With a 80% chance (or if we selected the "endpoint" attribute), change the attribute value
            if (this._withProbability(0.8) || changedAttributeKey === "endpoint") {
                const oldVal = node.attributes.get(changedAttributeKey);
                node.attributes.set(changedAttributeKey, oldVal + this._randomString(10));
            } else {
                //Otherwise, delete the attribute
                node.attributes.delete(changedAttributeKey);
            }
            //There's a 20% chance to insert a new attribute
            if (this._withProbability(0.2)) {
                node.attributes.set(this._randomString(10), this._randomString(10));
            }
        }
    }

    reshuffleAll(model) {
        model = ModelFactory.getModel(model);
        let moveCounter = 0;
        for (const inner of model.innerNodes()) {
            for (let i = 0; i < inner.numChildren(); i++) {
                moveCounter++
                const node = this._randomFrom(inner.childNodes);
                node.removeFromParent();
                inner.insertChild(this._randInt(inner.numChildren()), node);
            }
        }
        return {
            model: new Preprocessor().prepareModel(model),
            info: new DiffTestInfo(null, model.toPreOrderArray().length, 0, moveCounter, 0, 0)
        };
    }

}

exports.TreeGenerator = TreeGenerator;