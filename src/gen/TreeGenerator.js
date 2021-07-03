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
        return new Node(Dsl.KEYWORDS.ROOT.label);
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
        const node = new Node(Dsl.KEYWORDS.CALL.label);
        node.attributes.set("endpoint", this._randomFrom(this.endpoints));

        const parameters = new Node("parameters");

        //random label
        const label = new Node("label");
        //TODO label shouldnt be random
        label.data = this._randomFrom(this.labels);
        parameters.appendChild(label);

        //random method
        const method = new Node("method");
        method.data = this._randomFrom(Dsl.ENDPOINT_METHODS);
        parameters.appendChild(method);

        //random read variables as service call arguments
        const args = new Node("arguments");
        for (const readVariable of this._randomSubSet(this.variables, this._randInt(this.genParams.maxVars))) {
            const arg = new Node(readVariable);
            arg.data = "data." + readVariable;
            args.appendChild(arg);
        }
        if (args.hasChildren()) {
            parameters.appendChild(args);
        }
        node.appendChild(parameters);

        //random modified Variables
        const code = new Node("code");
        const codeUpdate = new Node("finalize");
        codeUpdate.data = "";
        for (const modifiedVariable of this._randomSubSet(this.variables, this._randInt(this.genParams.maxVars))) {
            codeUpdate.data += "data." + modifiedVariable + " = 420;"
        }

        //random read variables in code
        const codePrepare = new Node("prepare");
        codePrepare.data = "";
        for (const readVariable of this._randomSubSet(this.variables, this._randInt(this.genParams.maxVars))) {
            codePrepare.data += "fun(data." + readVariable + ");";
        }
        if (codeUpdate.data !== "") {
            code.appendChild(codeUpdate);
        }
        if (codePrepare.data !== "") {
            code.appendChild(codePrepare);
        }
        node.appendChild(code);

        return node;
    }

    _randomManipulate() {
        const node = new Node(Dsl.KEYWORDS.MANIPULATE.label);

        //random modified Variables
        node.data = "";
        for (const modifiedVariable of this._randomSubSet(this.variables, this._randInt(this.genParams.maxVars))) {
            node.data += "data." + modifiedVariable + " = 420;"
        }
        for (const readVariable of this._randomSubSet(this.variables, this._randInt(this.genParams.maxVars))) {
            node.data += "fun(data." + readVariable + ");";
        }

        return node;
    }

    _randomStop() {
        const node = new Node(Dsl.KEYWORDS.STOP.label);
        return node;
    }

    _randomEscape() {
        const node = new Node(Dsl.KEYWORDS.ESCAPE.label);
        return node;
    }

    _randomTerminate() {
        const node = new Node(Dsl.KEYWORDS.TERMINATE.label);
        return node;
    }

    _randomParallel() {
        const node = new Node(Dsl.KEYWORDS.PARALLEL.label);
        return node;
    }

    _randomParallelBranch() {
        const node = new Node(Dsl.KEYWORDS.PARALLEL_BRANCH.label);
        return node;
    }

    _randomChoose() {
        const node = new Node(Dsl.KEYWORDS.CHOOSE.label);
        node.attributes.set("mode", this._randomFrom(Dsl.CHOOSE_MODES));
        return node;
    }

    _randomAlternative() {
        const node = new Node(Dsl.KEYWORDS.ALTERNATIVE.label);

        //random condition
        const readVariable = this._randomFrom(this.variables);
        node.attributes.set("condition", "data." + readVariable + " < 69");

        return node;
    }

    _randomOtherwise() {
        const node = new Node(Dsl.KEYWORDS.OTHERWISE.label);
        return node;
    }

    _randomLoop() {
        const node = new Node(Dsl.KEYWORDS.LOOP.label);
        //random condition
        const readVariable = this._randomFrom(this.variables);
        node.attributes.set("condition", "data." + readVariable + " < 69");
        return node;
    }

    _randomCritical() {
        const node = new Node(Dsl.KEYWORDS.CRITICAL.label);
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


    changeTree(tree, numChanges) {
        //do not modify original tree
        tree = NodeFactory.getNode(tree);
        const oldSize = tree.toPreOrderArray().length;
        let insertionCounter = 0;
        let updateCounter = 0;
        let deletionCounter = 0;
        let moveCounter = 0;
        for (let i = 0; i < numChanges; i++) {
            switch (this._randomFrom(Array.of(...Dsl.CHANGE_TYPE_SET).filter(c => c !== Dsl.CHANGE_TYPES.MOVE_FROM && c !== Dsl.CHANGE_TYPES.NIL))) {
                case Dsl.CHANGE_TYPES.SUBTREE_INSERTION: {
                    insertionCounter++;
                    this._insertSubtreeRandomly(tree);
                    break;
                }
                case Dsl.CHANGE_TYPES.INSERTION: {
                    insertionCounter++;
                    if(this._withProbability(0.9)) {
                        this._insertLeafRandomly(tree);
                    } else {
                        this._insertArgRandomly(tree);
                    }
                    break;
                }
                case Dsl.CHANGE_TYPES.SUBTREE_DELETION: {
                    deletionCounter++;
                    this._deleteSubtreeRandomly(tree);
                    break;
                }
                case Dsl.CHANGE_TYPES.DELETION: {
                    deletionCounter++;
                    this._deleteLeafRandomly(tree);
                    break;
                }
                case Dsl.CHANGE_TYPES.MOVE_TO:
                case Dsl.CHANGE_TYPES.MOVE_FROM: {
                    moveCounter++;
                    if (this._moveRandomly(tree)) {
                        insertionCounter++;
                    }
                    break;
                }
                case Dsl.CHANGE_TYPES.UPDATE: {
                    updateCounter++;
                    this._updateRandomly(tree);
                    break;
                }
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
        const parent = this._randomFrom(tree.toPreOrderArray().filter(n => n.label === "arguments"));
        let newArg = this._randomFrom(this.variables);
        newArg = new Node(newArg, "data." + newArg);
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
                && n.label !== Dsl.KEYWORDS.PARALLEL_BRANCH.label
                && n.label !== Dsl.KEYWORDS.ALTERNATIVE.label
                && n.label !== Dsl.KEYWORDS.OTHERWISE.label));
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
            node = this._randomFrom(tree.toPreOrderArray().filter(n => n.data != null));
            //Change node data depending on type
            switch (node.label) {
                case "label": {
                    node.data = this._randomFrom(this.labels);
                    break;
                }
                case "method": {
                    //method change
                    node.data = this._randomFrom(Dsl.ENDPOINT_METHODS);
                    break;
                }
                case "prepare":
                case "update":
                case "rescue":
                case "finalize":
                case Dsl.KEYWORDS.MANIPULATE.label: {
                    //code change
                    const statements = node.data.split(";");
                    statements.splice(this._randInt(statements.length), 1);
                    if (this._withProbability(0.5)) {
                        //modify new variable
                        const newModVariable = this._randomFrom(this.variables);
                        statements.push("data." + newModVariable + " = 420;")
                    } else {
                        //read new variable
                        const newReadVariable = this._randomFrom(this.variables);
                        statements.push("fun(data." + newReadVariable + ");")
                    }
                    break;
                }
                default: {
                    node.data += this._randomString(10);
                }
            }

            node.data += this._randomString(10);
        } else {
            node = this._randomFrom(tree.nonPropertyNodes().filter(n => n.hasAttributes()));
            const changedAttributeKey = this._randomFrom(Array.of(...node.attributes.keys()));
            if (changedAttributeKey === "endpoint") {
                //change endpoint
                node.attributes.set("endpoint", this._randomFrom(this.endpoints));
            } else if(changedAttributeKey === "mode") {
                //change choose mode
                node.attributes.set("mode", this._randomFrom(Dsl.CHOOSE_MODES));
            } else if (this._withProbability(0.8)) {
                //20% chance to change string value
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

    reshuffleAll(tree) {
        tree = NodeFactory.getNode(tree);
        let moveCounter = 0;
        for (const inner of tree.innerNodes()) {
            for (let i = 0; i < inner.numChildren(); i++) {
                moveCounter++
                const node = this._randomFrom(inner.childNodes);
                node.removeFromParent();
                inner.insertChild(this._randInt(inner.numChildren()), node);
            }
        }
        return {
            tree: new Preprocessor().prepareTree(tree),
            info: new DiffTestInfo(null, tree.toPreOrderArray().length, 0, moveCounter, 0, 0)
        };
    }

}

