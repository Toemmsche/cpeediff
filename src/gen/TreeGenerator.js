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

import {Node} from "../tree/Node.js"
import {Preprocessor} from "../io/Preprocessor.js";
import {Dsl} from "../Dsl.js";
import {DiffTestInfo} from "../../test/diff_eval/DiffTestInfo.js";
import {NodeFactory} from "../tree/NodeFactory.js";
import {Config} from "../Config.js";

export class TreeGenerator {

    genParams;

    endpoints;
    labels;
    variables;

    constructor(genParams) {
        this.genParams = genParams;
        //at least 10 endpoints and labels
        this.endpoints = [];
        this.labels = [];
        this.variables = [];

        //about sqrt(n) variables, labels, and endpoints to choose from
        for (let i = 0; i < Math.max(2 * Math.log2(this.genParams.maxSize), 10); i++) {
            this.endpoints.push(this._randomString(this._randInt(20) + 10));
            this.labels.push(this._randomString(this._randInt(20) + 10));
            this.variables.push(this._randomString(this._randInt(10) + 5));
        }
    }

    randomTree(root = this._randomRoot()) {
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

        return new Preprocessor().prepareTree(root);
    }

    randomLeavesOnly(root = this._randomRoot()) {
        let currSize = 1;
        while (currSize < this.genParams.maxSize) {
            const newNode = this._randomCall();
            this._appendRandomly(root, newNode);
            currSize += newNode.toPreOrderArray().length;
        }
        return new Preprocessor().prepareTree(root);
    }

    _insertBetween(parent) {
        if (parent.label === Dsl.ELEMENTS.PARALLEL.label) {
            const between = this._randomParallelBranch();
            this._appendRandomly(parent, between);
            return between;
        } else if (parent.label === Dsl.ELEMENTS.CHOOSE.label) {
            let between;
            if (this._withProbability(0.5) && !parent.children.some(n => n.label === Dsl.ELEMENTS.OTHERWISE.label)) {
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
        return new Node(Dsl.ELEMENTS.ROOT.label);
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
            case Dsl.ELEMENTS.LOOP.label:
                return this._randomLoop();
            case Dsl.ELEMENTS.CHOOSE.label:
                return this._randomChoose();
            case Dsl.ELEMENTS.PARALLEL.label:
                return this._randomParallel();
            case Dsl.ELEMENTS.CRITICAL.label:
                return this._randomCritical();
            default:
                return this._randomLoop();
        }
    }


    _randomCall() {
        const node = new Node(Dsl.ELEMENTS.CALL.label);
        node.attributes.set(Dsl.CALL_PROPERTIES.ENDPOINT.label, this._randomFrom(this.endpoints));

        const parameters = new Node(Dsl.CALL_PROPERTIES.PARAMETERS.label);

        //random label
        const label = new Node(Dsl.CALL_PROPERTIES.LABEL.label);
        //TODO label shouldnt be random
        label.text = this._randomFrom(this.labels);
        parameters.appendChild(label);

        //random method
        const method = new Node(Dsl.CALL_PROPERTIES.METHOD.label);
        method.text = this._randomFrom(Dsl.ENDPOINT_METHODS);
        parameters.appendChild(method);

        //random read variables as service call arguments
        const args = new Node(Dsl.CALL_PROPERTIES.ARGUMENTS.label);
        for (const readVariable of this._randomSubSet(this.variables, this._randInt(this.genParams.maxVars))) {
            const arg = new Node(readVariable);
            arg.text = Config.VARIABLE_PREFIX + readVariable;
            args.appendChild(arg);
        }
        if (args.hasChildren()) {
            parameters.appendChild(args);
        }
        node.appendChild(parameters);

        //random written variables
        const code = new Node(Dsl.CALL_PROPERTIES.CODE.label);
        const codeUpdate = new Node(Dsl.CALL_PROPERTIES.FINALIZE.label);
        codeUpdate.text = "";
        for (const writtenVariable of this._randomSubSet(this.variables, this._randInt(this.genParams.maxVars))) {
            codeUpdate.text += Config.VARIABLE_PREFIX + writtenVariable + " = 420;"
        }

        //random read variables in code
        const codePrepare = new Node(Dsl.CALL_PROPERTIES.PREPARE.label);
        codePrepare.text = "";
        for (const readVariable of this._randomSubSet(this.variables, this._randInt(this.genParams.maxVars))) {
            codePrepare.text += "fun(data." + readVariable + ");";
        }
        if (codeUpdate.text !== "") {
            code.appendChild(codeUpdate);
        }
        if (codePrepare.text !== "") {
            code.appendChild(codePrepare);
        }
        node.appendChild(code);

        return node;
    }

    _randomManipulate() {
        const node = new Node(Dsl.ELEMENTS.MANIPULATE.label);

        //random written variables
        node.text = "";
        for (const writtenVariable of this._randomSubSet(this.variables, this._randInt(this.genParams.maxVars))) {
            node.text += Config.VARIABLE_PREFIX + writtenVariable + " = 420;"
        }
        for (const readVariable of this._randomSubSet(this.variables, this._randInt(this.genParams.maxVars))) {
            node.text += "fun(data." + readVariable + ");";
        }

        return node;
    }

    _randomStop() {
        const node = new Node(Dsl.ELEMENTS.STOP.label);
        return node;
    }

    _randomEscape() {
        const node = new Node(Dsl.ELEMENTS.ESCAPE.label);
        return node;
    }

    _randomTerminate() {
        const node = new Node(Dsl.ELEMENTS.TERMINATE.label);
        return node;
    }

    _randomParallel() {
        const node = new Node(Dsl.ELEMENTS.PARALLEL.label);
        return node;
    }

    _randomParallelBranch() {
        const node = new Node(Dsl.ELEMENTS.PARALLEL_BRANCH.label);
        return node;
    }

    _randomChoose() {
        const node = new Node(Dsl.ELEMENTS.CHOOSE.label);
        node.attributes.set(Dsl.INNER_PROPERTIES.MODE.label, this._randomFrom(Dsl.CHOOSE_MODES));
        return node;
    }

    _randomAlternative() {
        const node = new Node(Dsl.ELEMENTS.ALTERNATIVE.label);

        //random condition
        const readVariable = this._randomFrom(this.variables);
        node.attributes.set(Dsl.INNER_PROPERTIES.CONDITION.label, Config.VARIABLE_PREFIX + readVariable + " < 69");

        return node;
    }

    _randomOtherwise() {
        const node = new Node(Dsl.ELEMENTS.OTHERWISE.label);
        return node;
    }

    _randomLoop() {
        const node = new Node(Dsl.ELEMENTS.LOOP.label);
        //random condition
        const readVariable = this._randomFrom(this.variables);
        node.attributes.set(Dsl.INNER_PROPERTIES.CONDITION.label, Config.VARIABLE_PREFIX + readVariable + " < 69");
        return node;
    }

    _randomCritical() {
        const node = new Node(Dsl.ELEMENTS.CRITICAL.label);
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
        //include underscore (dollar sign is an invalid XML tag name)
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_';
        for (let i = 0; i < length; i++) {
            result.push(characters.charAt(this._randInt(characters.length)));
        }
        return result.join('');
    }


    changeTree(tree, changeParams) {
        const oldSize = tree.toPreOrderArray().length;
        //do not modify original tree
        tree = NodeFactory.getNode(tree);
        let insertionCounter = 0;
        let updateCounter = 0;
        let deletionCounter = 0;
        let moveCounter = 0;

        //set up random distribution of changes according to parameters
        const distributionString = "i".repeat(changeParams.insertionWeight)
            + "m".repeat(changeParams.moveWeight)
            + "u".repeat(changeParams.updateWeight)
            + "d".repeat(changeParams.deletionWeight);
        for (let i = 0; i < changeParams.numChanges; i++) {
            const op = this._randomFrom(distributionString.split(""));
            try {
                switch (op) {
                    case "i": {
                        insertionCounter++;
                        if (this._withProbability(0.2)) {
                            this._insertSubtreeRandomly(tree);
                        } else if (this._withProbability(0.9)) {
                            this._insertLeafRandomly(tree);
                        } else {
                            this._insertArgRandomly(tree);
                        }
                        break;
                    }
                    case "d": {
                        deletionCounter++;
                        if (this._withProbability(0.2)) {
                            this._deleteSubtreeRandomly(tree);
                        } else {
                            this._deleteLeafRandomly(tree);
                        }
                        break;
                    }
                    case "m": {
                        moveCounter++;
                        if (this._moveRandomly(tree)) {
                            insertionCounter++;
                        }
                        break;
                    }
                    case "u": {
                        updateCounter++;
                        this._updateRandomly(tree);
                        break;
                    }
                }
            } catch(e) {
                //TODO
                console.log("invalid change op")
            }
        }
        return {
            tree: new Preprocessor().prepareTree(tree),
            info: new DiffTestInfo(null, Math.max(oldSize, tree.toPreOrderArray().length), insertionCounter, moveCounter, updateCounter, deletionCounter)
        };

    }

    _insertSubtreeRandomly(tree) {
        const currSize = tree.toPreOrderArray().length;

        let parent = this._randomFrom(tree.innerNodes());
        parent = this._insertBetween(parent)

        let newNode = this._randomInner();
        this._appendRandomly(parent, newNode);
        newNode = this._insertBetween(newNode);

        //construct new tree with less nodes
        //store old max size value
        const oldMaxSize = this.genParams.maxSize;
        this.genParams.maxSize = Math.max(Math.log2(oldMaxSize), 5);
        //construct random subtree around the new inner node
        this.randomTree(newNode);
        //restore old max size
        this.genParams.maxSize = oldMaxSize;

        const newSize = tree.toPreOrderArray().length;
        if (tree.toPreOrderArray().length <= currSize) {
            throw new Error();
        }
    }


    _insertLeafRandomly(tree) {
        const currSize = tree.toPreOrderArray().length;

        let parent = this._randomFrom(tree.innerNodes());
        parent = this._insertBetween(parent)

        const newNode = this._randomLeaf();
        this._appendRandomly(parent, newNode);

        if (tree.toPreOrderArray().length <= currSize) {
            throw new Error();
        }
    }

    _insertArgRandomly(tree) {
        const parent = this._randomFrom(tree.toPreOrderArray().filter(n => n.label === Dsl.CALL_PROPERTIES.ARGUMENTS.label));
        let newArg = this._randomFrom(this.variables);
        newArg = new Node(newArg, Config.VARIABLE_PREFIX + newArg);
        this._appendRandomly(parent, newArg);
    }

    _deleteSubtreeRandomly(tree) {
        const node = this._randomFrom(tree.innerNodes().filter(n => !n.isRoot()));
        if (node != null) {
            node.removeFromParent();
        }

    }

    _deleteLeafRandomly(tree) {
        const node = this._randomFrom(tree.leaves());
        if (node != null) {
            node.removeFromParent();
        }
    }

    _moveRandomly(tree) {
        let movedNode = this._randomFrom(tree.nonPropertyNodes()
            .filter(n => !n.isRoot()
                && n.label !== Dsl.ELEMENTS.PARALLEL_BRANCH.label
                && n.label !== Dsl.ELEMENTS.ALTERNATIVE.label
                && n.label !== Dsl.ELEMENTS.OTHERWISE.label));
        movedNode.removeFromParent();
        let increaseInsertionCounter = false;
        let parent = this._randomFrom(tree.innerNodes());
        parent = this._insertBetween(parent);
        if (parent !== (parent = this._insertBetween(parent))) {
            increaseInsertionCounter = true;
        }

        this._appendRandomly(parent, movedNode);
        return increaseInsertionCounter;
    }

    _updateRandomly(tree) {
        let node;
        if (this._withProbability(0.6)) {
            node = this._randomFrom(tree.toPreOrderArray().filter(n => n.text != null));
            //Change node data depending on type
            switch (node.label) {
                case Dsl.CALL_PROPERTIES.LABEL.label: {
                    node.text = this._randomFrom(this.labels);
                    break;
                }
                case Dsl.CALL_PROPERTIES.METHOD.label: {
                    //method change
                    node.text = this._randomFrom(Dsl.ENDPOINT_METHODS);
                    break;
                }
                case Dsl.CALL_PROPERTIES.PREPARE.label:
                case Dsl.CALL_PROPERTIES.UPDATE.label:
                case Dsl.CALL_PROPERTIES.RESCUE.label:
                case Dsl.CALL_PROPERTIES.FINALIZE.label:
                case Dsl.ELEMENTS.MANIPULATE.label: {
                    //code change
                    const statements = node.text.split(";");
                    //remove a random statement
                    if(this._withProbability(0.5)) {
                        statements.splice(this._randInt(statements.length), 1);
                    }
                    //insert a new one
                    if (this._withProbability(0.33)) {
                        //modify new variable
                        const newModVariable = this._randomFrom(this.variables);
                        statements.push(Config.VARIABLE_PREFIX + newModVariable + " = 420")
                    } else if (this._withProbability(0.5)) {
                        //read new variable
                        const newReadVariable = this._randomFrom(this.variables);
                        statements.push("fun(" + Config.VARIABLE_PREFIX + newReadVariable + ")")
                    } else {
                        //read and write to new variable
                        const newVariable = this._randomFrom(this.variables);
                        statements.push(Config.VARIABLE_PREFIX + newVariable  + "++");
                    }
                    node.text = statements.join(";") + ";";
                    break;
                }
                default: {
                    node.text += this._randomString(10);
                }
            }
        } else {
            node = this._randomFrom(tree.nonPropertyNodes().filter(n => n.hasAttributes()));
            const changedAttributeKey = this._randomFrom(Array.of(...node.attributes.keys()));
            if (changedAttributeKey === Dsl.CALL_PROPERTIES.ENDPOINT.label) {
                //change endpoint
                node.attributes.set(Dsl.CALL_PROPERTIES.ENDPOINT.label, this._randomFrom(this.endpoints));
            } else if (changedAttributeKey === Dsl.INNER_PROPERTIES.MODE.label) {
                //change choose mode
                node.attributes.set(Dsl.INNER_PROPERTIES.MODE.label, this._randomFrom(Dsl.CHOOSE_MODES));
            } else if (this._withProbability(0.8)) {
                //80% chance to change string value
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
}

