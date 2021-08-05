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

import {Node} from "../../src/tree/Node.js"
import {Preprocessor} from "../../src/io/Preprocessor.js";
import {Dsl} from "../../src/Dsl.js";
import {ExpectedDiff} from "../expected/ExpectedDiff.js";
import {NodeFactory} from "../../src/tree/NodeFactory.js";
import {Config} from "../../src/Config.js";
import {Logger} from "../../util/Logger.js";
import {GeneratorParameters} from "./GeneratorParameters.js";
import {EditScript} from "../../src/diff/EditScript.js";

/**
 * A generator class for random (but well-formed) CPEE process trees.
 * The generation of trees is somewhat configurable by specifying {@see GeneratorParameters}.
 */
export class TreeGenerator {

    /**
     * The generator parameters used
     * @type GeneratorParameters
     * @private
     */
    _genParams;

    /**
     * An array of endpoints that generated call nodes can choose from
     * @type [String]
     * @private
     */
    _endpoints;

    /**
     * An array of service call labels that generated call nodes can choose from
     * @type [String]
     * @private
     */
    _labels;

    /**
     * An array of variable names that generated nodes can choose from
     * @type [String]
     * @private
     */
    _variables;

    /**
     * A possible edit script for representing the changes performed by {@see changeTree}.
     * This edit script does not have to be of minimum cost, it rather acts as a cost ceiling.
     * @type EditScript
     * @private
     */
    _possibleEditScript;

    /**
     * Construct a new generator with the given parameters.
     * @param genParams The parameters for process tree generation
     */
    constructor(genParams) {
        this._genParams = genParams;
        this._endpoints = [];
        this._labels = [];
        this._variables = [];

        //about 2*log_2(n) (at least 5)_variables, labels, and endpoints to choose from
        for (let i = 0; i < Math.max(2 * Math.log2(this._genParams.maxSize), 5); i++) {
            this._endpoints.push(this._randomString(this._randInt(20) + 10));
            this._labels.push(this._randomString(this._randInt(20) + 10));
            this._variables.push(this._randomString(this._randInt(10) + 5));
        }
    }

    /**
     * Generate a random process tree using the specified parameters and random endpoints, labels, and variables.
     * The resulting process tree should conform to the CPEE specification (syntactic correctness).
     * @param {Node} root Specify an optional root node for the tree. By default, a new root is generated.
     * @returns {Node} The root node of the generated process tree
     */
    randomTree(root = this._randomRoot()) {
        Logger.info("Generating random process tree with parameters " + this._genParams.toString() + "...", this);
        Logger.startTimed();
        //The inner nodes, from which a new parent node is picked at each extension step
        const inners = [root];
        let currSize = 1;
        while (currSize < this._genParams.maxSize) {
            let newNode;
            //TODO export probabilities to generator params
            //Pick a leaf node or inner node with a certain probability
            if (this._withProbability(0.6)) {
                newNode = this._randomLeaf();
            } else {
                newNode = this._randomInner();
            }
            //Find a valid parent node from the current inner node set
            const parent = this._pickValidParent(newNode, inners);

            //No valid parent is available (yet), continue
            if (parent == null) {
                continue;
            }

            if (newNode.isInnerNode()) {
                inners.push(newNode);
            }

            this._appendRandomly(parent, newNode);
            currSize += newNode.size();
        }

        //preprocess and prune empty nodes
        const preparedTree = new Preprocessor().prepareTree(root);
        Logger.stat("Tree generation took " + Logger.endTimed() + "ms", this);
        return preparedTree;
    }

    /**
     * Generate a random process tree that only contains leaf nodes.
     * @param {Node} root The root node of the generated process tree. A random root by default.
     * @return Node The root of the generated process tree
     */
    leavesOnly(root = this._randomRoot()) {
        let currSize = 1;
        while (currSize < this._genParams.maxSize && currSize < this._genParams.maxDegree) {
            const newNode = this._randomCall();
            this._appendRandomly(root, newNode);
            currSize += newNode.size();
        }
        return new Preprocessor().prepareTree(root);
    }

    /**
     * Picks a valid parent node among a collection of inner nodes.
     * @param {Node} node The node for which a parent should be found.
     * @param {[Node]} inners The array of inner nodes from which the parent should be picked.
     * @returns {Node|null} The parent node, if a suitable node could be found among the inner node array.
     * @private
     */
    _pickValidParent(node, inners) {
        //honor max width parameters as good as possible
        const filteredInners = inners.filter(n => n.degree() < this._genParams.maxDegree);
        if (filteredInners.length > 0) {
            //this would block
            inners = filteredInners;
        }

        //some inner nodes are restricted regarding their parent node
        //TODO critical too?
        if (node.isInnerNode() && node.label === Dsl.ELEMENTS.ALTERNATIVE.label) {
            return this._randomFrom(inners.filter(n => n.label === Dsl.ELEMENTS.CHOOSE.label));
        } else if (node.isInnerNode() && node.label === Dsl.ELEMENTS.OTHERWISE.label) {
            //find a choose node with no existing otherwise branch
            return this._randomFrom(inners.filter(n => {
                if (n.label !== Dsl.ELEMENTS.CHOOSE.label) return false;
                for (const child of n) {
                    if (child.label === Dsl.ELEMENTS.OTHERWISE.label) return false;
                }
                return true;
            }));
        } else if (node.isInnerNode() && node.label === Dsl.ELEMENTS.PARALLEL_BRANCH.label) {
            return this._randomFrom(inners.filter(n => n.label === Dsl.ELEMENTS.PARALLEL.label));
        } else {
            return this._randomFrom(inners.filter(n => n.label !== Dsl.ELEMENTS.PARALLEL.label
                && n.label !== Dsl.ELEMENTS.CHOOSE.label));
        }
    }

    /**
     * @returns {Node} A new root node
     * @private
     */
    _randomRoot() {
        return new Node(Dsl.ELEMENTS.ROOT.label);
    }

    /**
     * @returns {Node} A random leaf node from the CPEE DSL
     * @private
     */
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


    /**
     * @returns {Node} A random inner node from the CPEE DSL
     * @private
     */
    _randomInner() {
        //inner nodes are evenly distributed (except root node)
        const label = this._randomFrom(new Array(...Dsl.INNER_NODE_SET.values()).filter(n => n !== Dsl.ELEMENTS.ROOT.label));
        switch (label) {
            case Dsl.ELEMENTS.LOOP.label:
                return this._randomLoop();
            case Dsl.ELEMENTS.CHOOSE.label:
                return this._randomChoose();
            case Dsl.ELEMENTS.PARALLEL.label:
                return this._randomParallel();
            case Dsl.ELEMENTS.CRITICAL.label:
                return this._randomCritical();
            case Dsl.ELEMENTS.PARALLEL_BRANCH.label:
                return this._randomParallelBranch();
            case Dsl.ELEMENTS.ALTERNATIVE.label:
                return this._randomAlternative();
            case Dsl.ELEMENTS.OTHERWISE.label:
                return this._randomOtherwise();
            default:
                throw new Error("Unknown inner node label " + label);
        }
    }

    /**
     * Generate a new service call node with random endpoint, label, arguments, method, and read/written variables.
     * @returns {Node} The random <call> node.
     * @private
     */
    _randomCall() {
        const node = new Node(Dsl.ELEMENTS.CALL.label);
        node.attributes.set(Dsl.CALL_PROPERTIES.ENDPOINT.label, this._randomFrom(this._endpoints));

        const parameters = new Node(Dsl.CALL_PROPERTIES.PARAMETERS.label);

        //random label
        const label = new Node(Dsl.CALL_PROPERTIES.LABEL.label);
        //TODO label shouldnt be random
        label.text = this._randomFrom(this._labels);
        parameters.appendChild(label);

        //random method
        const method = new Node(Dsl.CALL_PROPERTIES.METHOD.label);
        method.text = this._randomFrom(Dsl.ENDPOINT_METHODS);
        parameters.appendChild(method);

        //random service call arguments
        const args = new Node(Dsl.CALL_PROPERTIES.ARGUMENTS.label);
        for (const readVariable of this._randomSubSet(this._variables, this._randInt(this._genParams.maxVars))) {
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
        for (const writtenVariable of this._randomSubSet(this._variables, this._randInt(this._genParams.maxVars))) {
            codeUpdate.text += Config.VARIABLE_PREFIX + writtenVariable + " = 420;"
        }

        //random read variables in code
        const codePrepare = new Node(Dsl.CALL_PROPERTIES.PREPARE.label);
        codePrepare.text = "";
        for (const readVariable of this._randomSubSet(this._variables, this._randInt(this._genParams.maxVars))) {
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

    /**
     * Generate a new script node with random read/written variables.
     * @returns {Node} The random <manipulate> node.
     * @private
     */
    _randomManipulate() {
        const node = new Node(Dsl.ELEMENTS.MANIPULATE.label);

        //random written _variables
        node.text = "";
        for (const writtenVariable of this._randomSubSet(this._variables, this._randInt(this._genParams.maxVars))) {
            node.text += Config.VARIABLE_PREFIX + writtenVariable + " = 420;"
        }
        for (const readVariable of this._randomSubSet(this._variables, this._randInt(this._genParams.maxVars))) {
            node.text += "fun(data." + readVariable + ");";
        }

        return node;
    }

    /**
     * @returns {Node} A new <stop> node
     * @private
     */
    _randomStop() {
        const node = new Node(Dsl.ELEMENTS.STOP.label);
        return node;
    }

    /**
     * @returns {Node} A new <escape> node
     * @private
     */
    _randomEscape() {
        const node = new Node(Dsl.ELEMENTS.ESCAPE.label);
        return node;
    }

    /**
     * @returns {Node} A new <terminate> node
     * @private
     */
    _randomTerminate() {
        const node = new Node(Dsl.ELEMENTS.TERMINATE.label);
        return node;
    }

    /**
     * @returns {Node} A new <parallel> node
     * @private
     */
    _randomParallel() {
        const node = new Node(Dsl.ELEMENTS.PARALLEL.label);
        return node;
    }

    /**
     * @returns {Node} A new <parallel_branch> node
     * @private
     */
    _randomParallelBranch() {
        const node = new Node(Dsl.ELEMENTS.PARALLEL_BRANCH.label);
        return node;
    }

    /**
     * Generates a new choose node with random choose mode.
     * @returns {Node} A new <choose> node
     * @private
     */
    _randomChoose() {
        const node = new Node(Dsl.ELEMENTS.CHOOSE.label);
        node.attributes.set(Dsl.INNER_PROPERTIES.MODE.label, this._randomFrom(Dsl.CHOOSE_MODES));
        return node;
    }

    /**
     * Generates a new alternative node with random condition.
     * @returns {Node} A new <alternative> node
     * @private
     */
    _randomAlternative() {
        const node = new Node(Dsl.ELEMENTS.ALTERNATIVE.label);

        //random condition
        const readVariable = this._randomFrom(this._variables);
        node.attributes.set(Dsl.INNER_PROPERTIES.CONDITION.label, Config.VARIABLE_PREFIX + readVariable + " < 69");

        return node;
    }

    /**
     * @returns {Node} A new <otherwise> node
     * @private
     */
    _randomOtherwise() {
        const node = new Node(Dsl.ELEMENTS.OTHERWISE.label);
        return node;
    }

    /**
     * Generates a new loop node with random condition.
     * @returns {Node} A new <loop> node
     * @private
     */
    _randomLoop() {
        const node = new Node(Dsl.ELEMENTS.LOOP.label);
        //random condition
        const readVariable = this._randomFrom(this._variables);
        node.attributes.set(Dsl.INNER_PROPERTIES.CONDITION.label, Config.VARIABLE_PREFIX + readVariable + " < 69");
        return node;
    }

    /**
     * @returns {Node} A new <critical> node
     * @private
     */
    _randomCritical() {
        const node = new Node(Dsl.ELEMENTS.CRITICAL.label);
        return node;
    }

    /**
     * Insert a node at a random position in the child list of a parent node.
     * @param {Node} parent The parent node
     * @param {Node} child The child node to be inserted
     * @private
     */
    _appendRandomly(parent, child) {
        let insertionIndex = this._randInt(parent.degree());
        if (parent.isRoot() && insertionIndex === 0) {
            insertionIndex++;
        }
        parent.insertChild(insertionIndex, child);
    }


    /**
     * Choose a random element from a given collection.
     * @param {Array|Set} collection The collection to be chosen from.
     * @returns {*|null} A random element from the collection, if there exist any.
     * @private
     */
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

    /**
     * Choose a random subset of fixed size from the elements of a collection.
     * @param {Array|Set} collection The collection to be chosen from.
     * @param {Number} amount The desired number of elements in the subset.
     * @returns {Set<*>} The random subset.
     * @private
     */
    _randomSubSet(collection, amount) {
        const res = [];
        for (let i = 0; i < amount; i++) {
            res.push(this._randomFrom(collection));
        }
        return new Set(res);
    }

    /**
     * @param {Number} max The (exclusive) ceiling for the random integer.
     * @returns {number} A random integer from 0 (inclusive) up to (exclusive) a max value.
     * @private
     */
    _randInt(max) {
        return Math.floor(Math.random() * max);
    }

    /**
     * @param {Number} prob A probability value from [0,1].
     * @returns {boolean} True with a chance equal to the probability value.
     * @private
     */
    _withProbability(prob) {
        return Math.random() < prob;
    }

    /**
     * Generate a random string from a given alphabet.
     * @param {Number} length The desired length of the string.
     * @returns {String} The random string.
     * @private
     */
    _randomString(length = this._randInt(100)) {
        const result = [];
        //include underscore (dollar sign is an invalid XML tag name)
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_';
        for (let i = 0; i < length; i++) {
            result.push(characters.charAt(this._randInt(characters.length)));
        }
        return result.join('');
    }


    /**
     * Apply changes (edit operations) to an existing tree. The distribution and amount of changes can be specified.
     * @param {Node} tree The root node of the tree to be changed.
     * @param {ChangeParameters} changeParams A set of parameters for the changes.
     * @returns {{tree: Node, expected: ExpectedDiff}} An anonymous object containing the root of the changed tree
     * and information about relevant for testing with this tree.
     */
    changeTree(tree, changeParams) {
        Logger.info("Changing process tree with parameters " + changeParams + "...", this);
        Logger.startTimed();
        const oldSize = tree.size();
        //do not modify original tree
        const oldTree = tree;
        tree = NodeFactory.getNode(tree);

        //set up random distribution of changes according to parameters
        const distributionString = "i".repeat(changeParams.insertionWeight)
            + "m".repeat(changeParams.moveWeight)
            + "u".repeat(changeParams.updateWeight)
            + "d".repeat(changeParams.deletionWeight);

        //Construct a possible edit script to describe the changes between the two trees
        //This edit script is not necessarily of minimum cost, but rather acts as a cost ceiling.
        this._possibleEditScript = new EditScript();
        for (let i = 0; i < changeParams.numChanges; i++) {
            const opChar = this._randomFrom(distributionString.split(""));
            try {
                switch (opChar) {
                    case "i": {
                        //we can insert a subtree, a leaf node, or a property node (only call arguments are supported)
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
                        //we can delete a subtree or a leaf node
                        if (this._withProbability(0.2)) {
                            this._deleteSubtreeRandomly(tree);
                        } else {
                            this._deleteLeafRandomly(tree);
                        }
                        break;
                    }
                    case "m": {
                        this._moveRandomly(tree);
                        break;
                    }
                    case "u": {
                        this._updateRandomly(tree);
                        break;
                    }
                }
            } catch (e) {
                Logger.warn("Edit operation not possible", this);
            }
        }
        //Record all changes applied during tree preparation
        const preparedTree = new Preprocessor().prepareTree(tree, new Map(), new Map(),  this._possibleEditScript);
        //Verify correctness of the edit script
        if(!this._possibleEditScript.verify(oldTree, preparedTree)) {
            Logger.error("Edit script not valid for changed tree", this);
        }
        Logger.stat("Changing tree took " + Logger.endTimed() + "ms", this);
        return {
            tree: preparedTree,
            expected: new ExpectedDiff(Math.max(oldSize, tree.size()), this._possibleEditScript)
        };

    }

    /**
     * Change a tree by adding a random subtree at a random position.
     * The subtree is limited in size by the generation parameters of this generator.
     * @param {Node} tree The tree to be changed.
     * @private
     */
    _insertSubtreeRandomly(tree) {
        const insertedTree = this._randomInner();
        const parent = this._pickValidParent(insertedTree, tree.innerNodes());
        this._appendRandomly(parent,insertedTree);

        //inserted tree is much smaller
        const generator = new TreeGenerator(Object.assign(new GeneratorParameters(), this._genParams));
        generator._genParams.maxSize = Math.max(Math.log2(this._genParams.maxSize), 20);

        //use the same set of random endpoints, labels, and variables
        generator._variables = this._variables;
        generator._endpoints = this._endpoints;
        generator._labels = this._labels;

        Logger.disableLogging();
        //construct random subtree around the new inner node
        generator.randomTree(insertedTree);
        Logger.enableLogging();

        //append insert operation to edit script
        this._possibleEditScript.insert(insertedTree);
    }

    /**
     * Change a tree by adding a random leaf at a random position.
     * @param {Node} tree The tree to be changed.
     * @private
     */
    _insertLeafRandomly(tree) {
        const insertedNode = this._randomLeaf();
        let parent = this._pickValidParent(insertedNode, tree.innerNodes());
        this._appendRandomly(parent, insertedNode);

        //append insert operation to edit script
        this._possibleEditScript.insert(insertedNode);
    }

    /**
     * Change a tree by adding a random argument to an existing service call node.
     * @param {Node} tree The tree to be changed.
     * @private
     */
    _insertArgRandomly(tree) {
        const parent = this._randomFrom(tree.toPreOrderArray().filter(n => n.label === Dsl.CALL_PROPERTIES.ARGUMENTS.label));
        let insertedArg = this._randomFrom(this._variables);
        insertedArg = new Node(insertedArg, Config.VARIABLE_PREFIX + insertedArg);
        this._appendRandomly(parent, insertedArg);

        //append insert operation to edit script
        this._possibleEditScript.insert(insertedArg)
    }

    /**
     * Change a tree by deleting a random subtree from it.
     * @param {Node} tree The tree to be changed.
     * @private
     */
    _deleteSubtreeRandomly(tree) {
        //cannot delete arbitrarily sized subtrees
        const oldMaxSize = this._genParams.maxSize;
        const node = this._randomFrom(tree.innerNodes().filter(n => !n.isRoot() && n.size() <= Math.sqrt(oldMaxSize)));
        node.removeFromParent();

        //append delete  operation to edit script
        this._possibleEditScript.delete(node);
    }

    /**
     * Change a tree by deleing a random leaf node from it.
     * @param {Node} tree The tree to be changed.
     * @private
     */
    _deleteLeafRandomly(tree) {
        const node = this._randomFrom(tree.leaves());
        node.removeFromParent();

        //append delete  operation to edit script
        this._possibleEditScript.delete(node);
    }

    /**
     * Change a tree by moving a random subtree (can also be a leaf) within it.
     * @param {Node} tree The tree to be changed.
     * @private
     */
    _moveRandomly(tree) {
        let movedNode = this._randomFrom(tree.nonPropertyNodes()
            .filter(n => !n.isRoot()
                && n.label !== Dsl.ELEMENTS.PARALLEL_BRANCH.label
                && n.label !== Dsl.ELEMENTS.ALTERNATIVE.label
                && n.label !== Dsl.ELEMENTS.OTHERWISE.label));
        movedNode.removeFromParent();
        const oldPath = movedNode.toXPathString();

        let parent = this._pickValidParent(movedNode, tree.innerNodes());

        this._appendRandomly(parent, movedNode);

        //append move operation to edit script
        this._possibleEditScript.move(oldPath, movedNode.toXPathString());
    }

    /**
     * Change a tree by updating a random node.
     * @param {Node} tree The tree to be changed.
     * @private
     */
    _updateRandomly(tree) {
        let node;
        if (this._withProbability(0.6)) {
            node = this._randomFrom(tree.toPreOrderArray().filter(n => n.text != null));
            //Change node data depending on type
            switch (node.label) {
                case Dsl.CALL_PROPERTIES.LABEL.label: {
                    node.text += this._randomString(10);
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
                    if (this._withProbability(0.5)) {
                        statements.splice(this._randInt(statements.length), 1);
                    }
                    //insert a new one
                    if (this._withProbability(0.33)) {
                        //modify new variable
                        const newModVariable = this._randomFrom(this._variables);
                        statements.push(Config.VARIABLE_PREFIX + newModVariable + " = 420")
                    } else if (this._withProbability(0.5)) {
                        //read new variable
                        const newReadVariable = this._randomFrom(this._variables);
                        statements.push("fun(" + Config.VARIABLE_PREFIX + newReadVariable + ")")
                    } else {
                        //read and write to new variable
                        const newVariable = this._randomFrom(this._variables);
                        statements.push(Config.VARIABLE_PREFIX + newVariable + "++");
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
                node.attributes.set(Dsl.CALL_PROPERTIES.ENDPOINT.label, this._randomFrom(this._endpoints));
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

        //append update operation to edit script
        this._possibleEditScript.update(node);
    }
}

