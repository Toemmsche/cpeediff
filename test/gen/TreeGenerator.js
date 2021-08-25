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

import {Node} from '../../src/tree/Node.js';
import {Preprocessor} from '../../src/io/Preprocessor.js';
import {Dsl} from '../../src/Dsl.js';
import {ExpectedDiff} from '../expected/ExpectedDiff.js';
import {Config} from '../../src/Config.js';
import {Logger} from '../../util/Logger.js';
import {GeneratorParameters} from './GeneratorParameters.js';
import {Matching} from '../../src/match/Matching.js';
import {EditScriptGenerator} from '../../src/diff/EditScriptGenerator.js';
import {DiffTestCase} from '../case/DiffTestCase.js';
import {IdExtractor} from '../../src/extract/IdExtractor.js';
import {ElementSizeExtractor} from '../../src/extract/ElementSizeExtractor.js';

/**
 * A generator class for random (but well-formed) CPEE process trees.
 * The generation of trees is somewhat configurable by specifying
 * {@see GeneratorParameters}.
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
   * Construct a new generator with the given parameters.
   * @param genParams The parameters for process tree generation
   */
  constructor(genParams) {
    this._genParams = genParams;
    this._endpoints = [];
    this._labels = [];
    this._variables = [];

    //TODO refine label construction
    //about 2*log_2(n) (at least 5)_variables, labels, and endpoints to choose
    // from
    for (let i = 0; i < Math.max(
        2 * Math.log2(this._genParams.maxSize),
        5
    ); i++) {
      this._endpoints.push(this._randomString(this._randInt(20) + 10));
      this._labels.push(this._randomString(this._randInt(20) + 10));
      this._variables.push(this._randomString(this._randInt(10) + 5));
    }
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
   * Change a tree by deleing a random leaf node from it.
   * @param {Node} tree The tree to be changed.
   * @private
   */
  _deleteLeafRandomly(tree) {
    const node = this._randomFrom(tree.leaves());
    node.removeFromParent();
  }

  /**
   * Change a tree by deleting a random subtree from it.
   * @param {Node} tree The tree to be changed.
   * @private
   */
  _deleteSubtreeRandomly(tree) {
    //cannot delete arbitrarily sized subtrees
    const oldMaxSize = this._genParams.maxSize;
    const node = this._randomFrom(tree.innerNodes()
        .filter(n => !n.isRoot() && n.size() <= Math.sqrt(oldMaxSize)));
    node.removeFromParent();
  }

  /**
   * Change a tree by adding a random argument to an existing service call node.
   * @param {Node} tree The tree to be changed.
   * @private
   */
  _insertArgRandomly(tree) {
    const parent = this._randomFrom(tree.toPreOrderArray()
        .filter(n => n.label === Dsl.CALL_PROPERTIES.ARGUMENTS.label));
    let insertedArg = this._randomFrom(this._variables);
    insertedArg = new Node(insertedArg, Config.VARIABLE_PREFIX + insertedArg);
    this._appendRandomly(parent, insertedArg);
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
  }

  /**
   * Change a tree by adding a random subtree at a random position.
   * The subtree is limited in size by the generation parameters of this
   * generator.
   * @param {Node} tree The tree to be changed.
   * @private
   */
  _insertSubtreeRandomly(tree) {
    const insertedTree = this._randomInner();
    const parent = this._pickValidParent(insertedTree, tree.innerNodes());
    this._appendRandomly(parent, insertedTree);

    //inserted tree is much smaller
    const generator = new TreeGenerator(Object.assign(
        new GeneratorParameters(),
        this._genParams
    ));
    generator._genParams.maxSize = Math.max(
        Math.log2(this._genParams.maxSize),
        20
    );

    //use the same set of random endpoints, labels, and variables
    generator._variables = this._variables;
    generator._endpoints = this._endpoints;
    generator._labels = this._labels;

    const loggingEnabled = Logger.disableLogging();
    //construct random subtree around the new inner node
    generator.randomTree(insertedTree);
    if (loggingEnabled) Logger.enableLogging();
  }

  /**
   * Change a tree by moving a random node within it.
   * @param {Node} tree The tree to be changed.
   * @private
   */
  _moveRandomly(tree) {

    const oldSize = tree.size();
    //It does not make sense to move a termination node
    const movedNode = this._randomFrom(tree.nonPropertyNodes().filter(n =>
        n.label !== Dsl.ELEMENTS.STOP.label &&
        n.label !== Dsl.ELEMENTS.ESCAPE.label &&
        n.label !== Dsl.ELEMENTS.TERMINATE.label &&
        !n.isRoot() &&
        n.label !== Dsl.ELEMENTS.PARALLEL_BRANCH.label
        && n.label !== Dsl.ELEMENTS.ALTERNATIVE.label
        && n.label !== Dsl.ELEMENTS.OTHERWISE.label));

    let parent;
    //chance for an interparent move
    if (this._withProbability(0.8)) {
      //prevent move to self
      parent = this._pickValidParent(
          movedNode,
          tree.innerNodes()
              .filter(n => !movedNode.toPreOrderArray().includes(n))
      );
    } else {
      parent = movedNode.parent;
    }

    //only remove node if we found a valid parent
    movedNode.removeFromParent();

    this._appendRandomly(parent, movedNode);
  }

  /**
   * Picks a valid parent node among a collection of inner nodes.
   * @param {Node} node The node for which a parent should be found.
   * @param {[Node]} inners The array of inner nodes from which the parent
   *     should be picked.
   * @returns {Node|null} The parent node, if a suitable node could be found
   *     among the inner node array.
   * @private
   */
  _pickValidParent(node, inners) {
    //honor max width parameters as good as possible
    const filteredInners = inners.filter(n => n.degree() < this._genParams.maxDegree);
    if (filteredInners.length > 0) {
      //this would block
      inners = filteredInners;
    }

    //Some nodes are restricted in terms of their parent node
    let filterFun;
    if (node.isLeaf() && node.label === Dsl.ELEMENTS.STOP.label
        || node.label === Dsl.ELEMENTS.TERMINATE.label
        || node.label === Dsl.ELEMENTS.ESCAPE.label) {
      //multiple termination nodes under a single parent just do not make sense
      filterFun = (n) => n.label !== Dsl.ELEMENTS.PARALLEL.label
          && n.label !== Dsl.ELEMENTS.CHOOSE.label
          && n.children.some(c =>
              c.label === Dsl.ELEMENTS.STOP.label
              || c.label === Dsl.ELEMENTS.TERMINATE.label
              || c.label === Dsl.ELEMENTS.ESCAPE.label);
    } else if (node.isInnerNode() && node.label === Dsl.ELEMENTS.ALTERNATIVE.label) {
      filterFun = (n) => n.label === Dsl.ELEMENTS.CHOOSE.label;
    } else if (node.isInnerNode() && node.label === Dsl.ELEMENTS.OTHERWISE.label) {
      //find a choose node with no existing otherwise branch
      filterFun = (n) => {
        if (n.label !== Dsl.ELEMENTS.CHOOSE.label) return false;
        for (const child of n) {
          if (child.label === Dsl.ELEMENTS.OTHERWISE.label) return false;
        }
        return true;
      };
    } else if (node.isInnerNode() && node.label === Dsl.ELEMENTS.PARALLEL_BRANCH.label) {
      filterFun = (n) => n.label === Dsl.ELEMENTS.PARALLEL.label;
    } else {
      filterFun = (n) => n.label !== Dsl.ELEMENTS.PARALLEL.label
          && n.label !== Dsl.ELEMENTS.CHOOSE.label;
    }

    //pick parent according to filter function
    const parent = this._randomFrom(inners.filter(filterFun));
    if (parent == null) {
      //error is handled by caller
      throw new Error('No valid parent left');
    }
    return parent;
  }

  /**
   * @param {Number} max The (exclusive) ceiling for the random integer.
   * @returns {number} A random integer from 0 (inclusive) up to a max value
   *     (exclusive).
   * @private
   */
  _randInt(max) {
    return Math.floor(Math.random() * max);
  }

  /**
   * Generates a new alternative node with random condition.
   * @returns {Node} A new <alternative> node
   * @private
   */
  _randomAlternative() {
    const node = new Node(Dsl.ELEMENTS.ALTERNATIVE.label);

    //random condition on single variable
    const readVariable = this._randomFrom(this._variables);
    node.attributes.set(
        Dsl.INNER_PROPERTIES.CONDITION.label,
        Config.VARIABLE_PREFIX + readVariable + ' < 69'
    );

    return node;
  }

  /**
   * Generate a new service call node with random endpoint, label, arguments,
   * method, and read/written variables.
   * @returns {Node} The random <call> node.
   * @private
   */
  _randomCall() {
    const node = new Node(Dsl.ELEMENTS.CALL.label);
    node.attributes.set(
        Dsl.CALL_PROPERTIES.ENDPOINT.label,
        this._randomFrom(this._endpoints)
    );

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
    for (const readVariable of this._randomSubSet(
        this._variables,
        this._randInt(this._genParams.maxVars)
    )) {
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
    const finalizeCode = new Node(Dsl.CALL_PROPERTIES.FINALIZE.label);
    finalizeCode.text = '';
    for (const writtenVariable of this._randomSubSet(
        this._variables,
        this._randInt(this._genParams.maxVars)
    )) {
      finalizeCode.text += Config.VARIABLE_PREFIX + writtenVariable + ' = 420;';
    }

    //random read variables in code
    for (const readVariable of this._randomSubSet(
        this._variables,
        this._randInt(this._genParams.maxVars)
    )) {
      finalizeCode.text += 'fun(data.' + readVariable + ');';
    }
    if (finalizeCode.text !== '') {
      code.appendChild(finalizeCode);
    }
    if (code.hasChildren()) {
      node.appendChild(code);
    }

    return node;
  }

  /**
   * Generates a new choose node with random choose mode.
   * @returns {Node} A new <choose> node
   * @private
   */
  _randomChoose() {
    const node = new Node(Dsl.ELEMENTS.CHOOSE.label);
    if (this._withProbability(0.5)) {
      node.attributes.set(
          Dsl.INNER_PROPERTIES.CHOOSE_MODE.label,
          this._randomFrom(Dsl.INNER_PROPERTIES.CHOOSE_MODE.options)
      );
    }
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
   * @returns {Node} A new <escape> node
   * @private
   */
  _randomEscape() {
    const node = new Node(Dsl.ELEMENTS.ESCAPE.label);
    return node;
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
   * @returns {Node} A random inner node from the CPEE DSL
   * @private
   */
  _randomInner() {
    //inner nodes are evenly distributed (except root node)
    const label = this._randomFrom(new Array(...Dsl.INNER_NODE_SET.values()).filter(
        n => n !== Dsl.ELEMENTS.ROOT.label));
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
        throw new Error('Unknown inner node label ' + label);
    }
  }

  /**
   * @returns {Node} A random leaf node from the CPEE DSL
   * @private
   */
  _randomLeaf() {
    let node;
    //about two-third chance to add a call
    if (this._withProbability(0.7)) {
      node = this._randomCall();
    } else if (this._withProbability(0.9)) {
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
   * Generates a new loop node with random condition.
   * @returns {Node} A new <loop> node
   * @private
   */
  _randomLoop() {
    const node = new Node(Dsl.ELEMENTS.LOOP.label);
    //random condition
    const readVariable = this._randomFrom(this._variables);
    node.attributes.set(
        Dsl.INNER_PROPERTIES.CONDITION.label,
        Config.VARIABLE_PREFIX + readVariable + ' < 69'
    );

    if (this._withProbability(0.5)) {
      //random mode
      node.attributes.set(
          Dsl.INNER_PROPERTIES.LOOP_MODE.label,
          this._randomFrom(Dsl.INNER_PROPERTIES.LOOP_MODE.options)
      );
    }
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
    node.text = '';
    for (const writtenVariable of this._randomSubSet(
        this._variables,
        this._randInt(this._genParams.maxVars)
    )) {
      node.text += Config.VARIABLE_PREFIX + writtenVariable + ' = 420;';
    }
    for (const readVariable of this._randomSubSet(
        this._variables,
        this._randInt(this._genParams.maxVars)
    )) {
      node.text += 'fun(data.' + readVariable + ');';
    }

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
   * @returns {Node} A new <parallel> node
   * @private
   */
  _randomParallel() {
    const node = new Node(Dsl.ELEMENTS.PARALLEL.label);
    if (this._withProbability(0.5)) {
      node.attributes.set(
          Dsl.INNER_PROPERTIES.PARALLEL_WAIT.label,
          Dsl.INNER_PROPERTIES.PARALLEL_WAIT.default
      );

      node.attributes.set(
          Dsl.INNER_PROPERTIES.PARALLEL_CANCEL.label,
          this._randomFrom(Dsl.INNER_PROPERTIES.PARALLEL_CANCEL.options)
      );
    }
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
   * @returns {Node} A new root node
   * @private
   */
  _randomRoot() {
    return new Node(Dsl.ELEMENTS.ROOT.label);
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
   * @returns {Node} A new <terminate> node
   * @private
   */
  _randomTerminate() {
    const node = new Node(Dsl.ELEMENTS.TERMINATE.label);
    return node;
  }

  /**
   * Change a tree by updating a random node.
   * @param {Node} tree The tree to be changed.
   * @private
   */
  _updateRandomly(tree) {
    let node;
    if (this._withProbability(0.6)) {
      node = this._randomFrom(tree.toPreOrderArray()
          .filter(n => n.text != null));
      //Change node data depending on type
      switch (node.label) {
        case Dsl.CALL_PROPERTIES.LABEL.label: {
          if (this._withProbability(0.5)) {
            //shrink label
            node.text = node.text.substring(this._randInt(node.text.length));
          }
          if (this._withProbability(0.5)) {
            //extend label
            node.text += this._randomString(10);
          }
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
          const statements = node.text.split(';');
          //remove a random statement
          if (this._withProbability(0.5)) {
            statements.splice(this._randInt(statements.length), 1);
          }
          //insert a new one
          if (this._withProbability(0.33)) {
            //modify new variable
            const newModVariable = this._randomFrom(this._variables);
            statements.push(Config.VARIABLE_PREFIX + newModVariable + ' = 420');
          } else if (this._withProbability(0.5)) {
            //read new variable
            const newReadVariable = this._randomFrom(this._variables);
            statements.push('fun(' + Config.VARIABLE_PREFIX + newReadVariable + ')');
          } else {
            //read and write to new variable
            const newVariable = this._randomFrom(this._variables);
            statements.push(Config.VARIABLE_PREFIX + newVariable + '++');
          }
          node.text = statements.join(';') + ';';
          break;
        }
        default: {
          node.text += this._randomString(10);
        }
      }
    } else {
      node = this._randomFrom(tree.nonPropertyNodes()
          .filter(n => n.hasAttributes()));
      const changedAttributeKey = this._randomFrom(Array.of(...node.attributes.keys()));
      switch (changedAttributeKey) {
        case Dsl.CALL_PROPERTIES.ENDPOINT.label: {
          //change endpoint
          node.attributes.set(
              Dsl.CALL_PROPERTIES.ENDPOINT.label,
              this._randomFrom(this._endpoints)
          );
          break;
        }
        case Dsl.INNER_PROPERTIES.CHOOSE_MODE.label: {
          //change choose mode
          const chooseMode = node.attributes.get(changedAttributeKey);
          node.attributes.set(
              changedAttributeKey,
              this._randomFrom(Dsl.INNER_PROPERTIES.CHOOSE_MODE.options.filter(o => o !== chooseMode))
          );
          break;
        }
        case Dsl.INNER_PROPERTIES.LOOP_MODE.label: {
          //change choose mode
          const loopMode = node.attributes.get(changedAttributeKey);
          node.attributes.set(
              changedAttributeKey,
              this._randomFrom(Dsl.INNER_PROPERTIES.LOOP_MODE.options.filter(o => o !== loopMode))
          );
          break;
        }
        case Dsl.INNER_PROPERTIES.PARALLEL_WAIT.label: {
          //change wait number
          let wait = parseInt(node.attributes.get(changedAttributeKey));
          wait++;
          node.attributes.set(changedAttributeKey, wait.toString());
          break;
        }
        case Dsl.INNER_PROPERTIES.PARALLEL_CANCEL.label: {
          //change cancel mode
          const parallelCancel = node.attributes.get(changedAttributeKey);
          node.attributes.set(
              changedAttributeKey,
              this._randomFrom(Dsl.INNER_PROPERTIES.PARALLEL_CANCEL.options.filter(
                  o => o !== parallelCancel))
          );
          break;
        }
        case Dsl.INNER_PROPERTIES.CONDITION.label : {
          //expand condition
          node.attributes.set(
              changedAttributeKey,
              node.attributes.get(changedAttributeKey)
                  + ' && ' + this._randomFrom(this._variables) + ' > 0');
          break;
        }
        default: {
          if (this._withProbability(0.6)) {
            //60% chance to change string value
            const oldVal = node.attributes.get(changedAttributeKey);
            node.attributes.set(
                changedAttributeKey,
                oldVal + this._randomString(10)
            );
          } else {
            //Otherwise, delete the attribute
            node.attributes.delete(changedAttributeKey);
          }
        }
      }
    }
    //There's a chance to insert a new random attribute, regardless of the
    // applied update
    if (this._withProbability(0.4)) {
      node.attributes.set(this._randomString(10), this._randomString(10));
    }
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
   * Apply changes (edit operations) to an existing tree. The distribution and
   * amount of changes can be specified.
   * @param {Node} tree The root node of the tree to be changed.
   * @param {ChangeParameters} changeParams A set of parameters for the
   *     changes.
   * @returns {{testCase: DiffTestCase, matching: Matching}} An object
   *     containing the root of the changed tree and information relevant for
   *     the evaluation.
   */
  changeTree(tree, changeParams) {
    Logger.info(
        'Changing process tree with parameters ' + changeParams.toString() + '...',
        this
    );
    Logger.startTimed();

    //do not modify original tree
    const original = tree;
    const oldTree = Node.fromNode(tree);
    tree = Node.fromNode(tree);

    //set up random distribution of changes according to parameters
    const distributionString = 'i'.repeat(changeParams.insertionWeight)
        + 'm'.repeat(changeParams.moveWeight)
        + 'u'.repeat(changeParams.updateWeight)
        + 'd'.repeat(changeParams.deletionWeight);

    //A mapping between the original and changed tree
    const oldToNewMap = new Map();
    let oldPreOrderArray = oldTree.toPreOrderArray();
    let newPreOrderArray = tree.toPreOrderArray();
    //initially all nodes are mapped
    for (let i = 0; i < newPreOrderArray.length; i++) {
      oldToNewMap.set(oldPreOrderArray[i], newPreOrderArray[i]);
    }

    const temp = tree;
    //Should changes be randomly distributed or local?
    if (changeParams.local) {
      const elementSizeExtractor = new ElementSizeExtractor();
      //Changes should be local => only change a subtree containing at least
      // max(10, treeSize/50) nodes
      tree = tree
          .innerNodes()
          .filter(n => elementSizeExtractor.get(n) >= 20)//Math.max(elementSizeExtractor.get(tree)
          // / 50, 10))
          .sort((a, b) => elementSizeExtractor.get(a) - elementSizeExtractor.get(
              b))
          [0];
    }
    let skippedOpCounter = 0;
    for (let i = 0; i < changeParams.totalChanges; i++) {
      const opChar = this._randomFrom(distributionString.split(''));
      try {
        switch (opChar) {
          case 'i': {
            //we can insert a subtree, a leaf node, or a property node (only
            // call arguments are supported)
            if (this._withProbability(0.2)) {
              this._insertSubtreeRandomly(tree);
            } else if (this._withProbability(0.9)) {
              this._insertLeafRandomly(tree);
            } else {
              this._insertArgRandomly(tree);
            }
            break;
          }
          case 'd': {
            if (this._withProbability(0.2)) {
              this._deleteSubtreeRandomly(tree);
            } else {
              this._deleteLeafRandomly(tree);
            }
            break;
          }
          case 'm': {
            this._moveRandomly(tree);
            break;
          }
          case 'u': {
            this._updateRandomly(tree);
            break;
          }
        }
      } catch (e) {
        skippedOpCounter++;
      }
    }
    if (skippedOpCounter > 0) {
      Logger.warn(
          skippedOpCounter + ' edit operation(s) could not be applied',
          this
      );
    }
    if (changeParams.local) {
      //reset tree
      tree = temp;
    }

    //Record all changes applied during tree preparation
    const preparedTree = new Preprocessor().preprocess(tree);

    //construct the matching
    const newNodeSet = new Set(preparedTree.toPreOrderArray());
    //one matching to be used in the edit script generation, another for
    // returning
    const matching = new Matching();
    const originalMatches = [];
    const idExtractor = new IdExtractor();
    for (const oldNode of oldTree.toPreOrderArray()) {
      const match = oldToNewMap.get(oldNode);
      if (newNodeSet.has(match)) {
        matching.matchNew(match, oldNode);
        originalMatches.push([
          idExtractor.get(match),
          idExtractor.get(oldNode)
        ]);
      }
    }

    const loggingEnabled = Logger.disableLogging();
    //generate an edit script from the matching
    const proposedEditScript = new EditScriptGenerator().generateEditScript(
        oldTree,
        preparedTree,
        matching
    );
    if (loggingEnabled) Logger.enableLogging();

    //Make returned matching conform to generated test case
    const originalPreOrder = original.toPreOrderArray();
    const newPreOrder = preparedTree.toPreOrderArray();
    const returnMatching = new Matching();
    for (const match of originalMatches) {
      returnMatching.matchNew(
          newPreOrder[match[0]],
          originalPreOrder[match[1]]
      );
    }

    const testCase = new DiffTestCase(
        Math.max(
            original.size(),
            preparedTree.size()
        ) + '_' + proposedEditScript.size() + (changeParams.local ? '_local'
                                                                  : ''),
        original, preparedTree,
        new ExpectedDiff(proposedEditScript)
    );

    Logger.stat('Changing tree took ' + Logger.endTimed() + 'ms', this);
    return {
      testCase: testCase,
      matching: returnMatching
    };
  }

  /**
   * Generate a random process tree that only contains leaf nodes.
   * @param {Node} root The root node of the generated process tree. A random
   *     root by default.
   * @return Node The root of the generated process tree
   */
  leavesOnly(root = this._randomRoot()) {
    let currSize = 1;
    while (currSize < this._genParams.maxSize && currSize < this._genParams.maxDegree) {
      const newNode = this._randomCall();
      this._appendRandomly(root, newNode);
      currSize += newNode.size();
    }
    return new Preprocessor().preprocess(root);
  }

  /**
   * Generate the second version of a random process tree that is both O(n)
   * deep and O(n) wide. It should force the worst case complexity in the
   * CpeeDiff algorithm.
   * @param {Node} root The root node of the generated process tree. A random
   *     root by default.
   * @return Node The root of the generated process tree.
   */
  newDeepAndWide(root = this._randomRoot()) {
    //Make O(n) deep
    let currNode = root;
    for (let i = 0; i < this._genParams.maxSize / 2; i++) {
      const nextChild = new Node(Dsl.ELEMENTS.CRITICAL.label);
      currNode.appendChild(nextChild);
      currNode = nextChild;
    }

    //Make O(n) wide
    for (let i = 0; i < this._genParams.maxSize / 2; i++) {
      const nextChild = new Node(Dsl.ELEMENTS.MANIPULATE.label);
      nextChild.text = 'data.var' + i + '++;';
      currNode.appendChild(nextChild);
    }

    return root;
  }

  /**
   * Generate the first version of process tree that is both O(n) deep and O(n)
   * wide. It should force the worst case complexity in the CpeeDiff algorithm.
   * @param {Node} root The root node of the generated process tree. A random
   *     root by default.
   * @return Node The root of the generated process tree.
   */
  oldDeepAndWide(root = this._randomRoot()) {
    //Make O(n) deep
    let currNode = root;
    for (let i = 0; i < this._genParams.maxSize / 2; i++) {
      const nextChild = new Node(Dsl.ELEMENTS.CRITICAL.label);
      currNode.appendChild(nextChild);
      currNode = nextChild;
    }

    //Make O(n) wide
    for (let i = 0; i < this._genParams.maxSize / 2; i++) {
      const nextChild = new Node(Dsl.ELEMENTS.TERMINATE.label);
      currNode.appendChild(nextChild);
    }
    return root;
  }

  /**
   * Generate a random process tree using the specified parameters and random
   * endpoints, labels, and variables. The resulting process tree should
   * conform to the CPEE specification (syntactic correctness).
   * @param {Node} root Specify an optional root node for the tree. By default,
   *     a new root is generated.
   * @returns {Node} The root node of the generated process tree
   */
  randomTree(root = this._randomRoot()) {
    Logger.info(
        'Generating random process tree with parameters ' + this._genParams.toString() + '...',
        this
    );
    Logger.startTimed();
    //The inner nodes, from which a new parent node is picked at each extension
    // step
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

      try {
        //Find a valid parent node from the current inner node set
        const parent = this._pickValidParent(newNode, inners);

        if (newNode.isInnerNode()) {
          inners.push(newNode);
        }

        this._appendRandomly(parent, newNode);
        currSize += newNode.size();
      } catch (error) {

      }
    }

    //preprocess and prune empty nodes
    const preparedTree = new Preprocessor().preprocess(root);
    Logger.stat('Tree generation took ' + Logger.endTimed() + 'ms', this);
    return preparedTree;
  }
}

