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
 * A generator for random (but well-formed) CPEE process trees.
 * The generation of trees is somewhat configurable through the use of
 * parameters.
 * Also offers functionality to change process trees in a configurable fashion.
 *
 * @see GeneratorParameters
 * @see ChangeParameters
 */
export class TreeGenerator {
  /**
   * Parameters for the generation of random process trees.
   * @type {GeneratorParameters}
   * @private
   * @const
   */
  #genParams;
  /**
   * An array of endpoints that generated call nodes can choose from
   * @type {Array<String>}
   * @private
   */
  #endpoints;
  /**
   * An array of service call labels that generated call nodes can choose from
   * @type {Array<String>}
   * @private
   */
  #labels;
  /**
   * An array of variable names that generated nodes can choose from
   * @type {Array<String>}
   * @private
   */
  #variables;

  /**
   * Construct a new TreeGenerator instance.
   * @param {GeneratorParameters} genParams Parameters for the generation of
   *     random process trees.
   */
  constructor(genParams) {
    this.#genParams = genParams;
    this.#endpoints = [];
    this.#labels = [];
    this.#variables = [];

    // TODO refine label construction

    // About 2*log_2(n) (at least 5) variables, labels, and endpoints to choose
    // from
    for (let i = 0; i < Math.max(
        2 * Math.log2(this.#genParams.size),
        5,
    ); i++) {
      this.#endpoints.push(this.#randomString(this.#randInt(20) + 10));
      this.#labels.push(this.#randomString(this.#randInt(30) + 10));
      this.#variables.push(this.#randomString(this.#randInt(10) + 5));
    }
  }

  /**
   * Insert a node at a random position in the child list of a parent node.
   * @param {Node} parent The parent node
   * @param {Node} child The child node to be inserted
   * @private
   */
  #appendRandomly(parent, child) {
    let insertionIndex = this.#randInt(parent.degree());
    if (parent.isRoot() && insertionIndex === 0) {
      insertionIndex++;
    }
    parent.insertChild(insertionIndex, child);
  }

  /**
   * Apply edit operations to an existing tree. The distribution and
   * amount of changes can be specified.
   * @param {Node} tree The root node of the tree to be changed.
   * @param {ChangeParameters} changeParams A set of parameters for the
   *     changes.
   * @return {{testCase: DiffTestCase, matching: Matching}} An object
   *     containing the corresponding diff test case and the expected matching.
   */
  changeTree(tree, changeParams) {
    Logger.info(
        'Changing process tree with parameters ' +
        changeParams.toString() + '...',
        this,
    );
    Logger.startTimed();

    // do not modify original tree
    const original = tree;
    const oldTree = Node.fromNode(tree);
    let newTree = Node.fromNode(tree);

    // set up random distribution of changes according to parameters
    const distributionString =
        'i'.repeat(changeParams.insertionWeight) +
        'm'.repeat(changeParams.moveWeight) +
        'u'.repeat(changeParams.updateWeight) +
        'd'.repeat(changeParams.deletionWeight);

    // A mapping between the original and changed tree
    const oldToNewMap = new Map();
    const oldPreOrderArray = oldTree.toPreOrderArray();
    const newPreOrderArray = newTree.toPreOrderArray();
    // Initially, all nodes are mapped
    for (let i = 0; i < newPreOrderArray.length; i++) {
      oldToNewMap.set(oldPreOrderArray[i], newPreOrderArray[i]);
    }

    const temp = newTree;
    // Should changes be randomly distributed or local?
    if (changeParams.local) {
      const elementSizeExtractor = new ElementSizeExtractor();
      // Changes should be local => only change a subtree containing at least
      // max(10, treeSize/50) nodes
      newTree = newTree
          .inners()
          .filter((inner) => elementSizeExtractor.get(inner) >= 20)
          .sort((a, b) => elementSizeExtractor.get(a) -
              elementSizeExtractor.get(b))[0];
    }
    let skippedOpCounter = 0;
    for (let i = 0; i < changeParams.totalChanges; i++) {
      const opChar = this.#randomFrom(distributionString.split(''));
      try {
        switch (opChar) {
          case 'i': {
            // we can insert a subtree, a leaf node, or a property node (only
            // call arguments are supported)
            if (this.#withProbability(0.2)) {
              this.#insertSubtreeRandomly(newTree);
            } else if (this.#withProbability(0.9)) {
              this.#insertLeafRandomly(newTree);
            } else {
              this.#insertArgRandomly(newTree);
            }
            break;
          }
          case 'd': {
            if (this.#withProbability(0.2)) {
              this.#deleteSubtreeRandomly(newTree);
            } else {
              this.#deleteLeafRandomly(newTree);
            }
            break;
          }
          case 'm': {
            this.#moveRandomly(newTree);
            break;
          }
          case 'u': {
            this.#updateRandomly(newTree);
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
          this,
      );
    }
    if (changeParams.local) {
      // reset newTree
      newTree = temp;
    }

    // Record all changes applied during newTree preparation
    newTree = new Preprocessor().preprocess(newTree);

    // construct the matching
    const newNodeSet = new Set(newTree.toPreOrderArray());

    // Used for edit script generation
    const matching = new Matching();
    // Used for the return value
    const originalMatches = [];
    const idExtractor = new IdExtractor();
    for (const oldNode of oldTree.toPreOrderArray()) {
      const match = oldToNewMap.get(oldNode);
      if (newNodeSet.has(match)) {
        matching.matchNew(match, oldNode);
        // Cannot use references
        originalMatches.push([
          idExtractor.get(match),
          idExtractor.get(oldNode),
        ]);
      }
    }

    const loggingEnabled = Logger.disableLogging();
    // generate an edit script from the matching
    const proposedEditScript = new EditScriptGenerator().generateEditScript(
        oldTree,
        newTree,
        matching,
    );
    if (loggingEnabled) Logger.enableLogging();

    // Make returned matching conform to generated test case
    const originalPreOrder = original.toPreOrderArray();
    const newPreOrder = newTree.toPreOrderArray();
    const returnMatching = new Matching();
    for (const match of originalMatches) {
      returnMatching.matchNew(
          newPreOrder[match[0]],
          originalPreOrder[match[1]],
      );
    }

    const testCase = new DiffTestCase(
        Math.max(
            original.size(),
            newTree.size(),
        ) + '_' + proposedEditScript.size(),
        original,
        newTree,
        new ExpectedDiff(proposedEditScript),
    );

    Logger.stat('Changing tree took ' + Logger.endTimed() + 'ms', this);
    return {
      testCase: testCase,
      matching: returnMatching,
    };
  }

  /**
   * Change a tree by deleing a random leaf node from it.
   * @param {Node} tree The tree to be changed.
   * @private
   */
  #deleteLeafRandomly(tree) {
    const node = this.#randomFrom(tree.leaves());
    node.removeFromParent();
  }

  /**
   * Change a tree by deleting a random subtree from it.
   * @param {Node} tree The tree to be changed.
   * @private
   */
  #deleteSubtreeRandomly(tree) {
    // cannot delete arbitrarily sized subtrees
    const oldsize = this.#genParams.size;
    const node = this.#randomFrom(tree.inners()
        .filter((n) => !n.isRoot() && n.size() <= Math.sqrt(oldsize)));
    node.removeFromParent();
  }

  /**
   * Change a tree by adding a random argument to an existing service call node.
   * @param {Node} tree The tree to be changed.
   * @private
   */
  #insertArgRandomly(tree) {
    const parent = this.#randomFrom(tree.toPreOrderArray()
        .filter((n) => n.label === Dsl.CALL_PROPERTIES.ARGUMENTS.label));
    let insertedArg = this.#randomFrom(this.#variables);
    insertedArg = new Node(insertedArg, Config.VARIABLE_PREFIX + insertedArg);
    this.#appendRandomly(parent, insertedArg);
  }

  /**
   * Change a tree by adding a random leaf at a random position.
   * @param {Node} tree The tree to be changed.
   * @private
   */
  #insertLeafRandomly(tree) {
    const insertedNode = this.#randomLeaf();
    const parent = this.#pickValidParent(insertedNode, tree.inners());
    this.#appendRandomly(parent, insertedNode);
  }

  /**
   * Change a tree by adding a random subtree at a random position.
   * The subtree is limited in size by the generation parameters of this
   * generator.
   * @param {Node} tree The tree to be changed.
   * @private
   */
  #insertSubtreeRandomly(tree) {
    const insertedTree = this.#randomInner();
    const parent = this.#pickValidParent(insertedTree, tree.inners());
    this.#appendRandomly(parent, insertedTree);

    // inserted tree is much smaller
    const generator = new TreeGenerator(Object.assign(
        new GeneratorParameters(),
        this.#genParams,
    ));
    generator.#genParams.size = Math.max(
        Math.log2(this.#genParams.size),
        20,
    );

    // use the same set of random endpoints, labels, and variables
    generator.#variables = this.#variables;
    generator.#endpoints = this.#endpoints;
    generator.#labels = this.#labels;

    const loggingEnabled = Logger.disableLogging();
    // construct random subtree around the new inner node
    generator.randomTree(insertedTree);
    if (loggingEnabled) Logger.enableLogging();
  }

  /**
   * Change a tree by moving a random node within it.
   * @param {Node} tree The tree to be changed.
   * @private
   */
  #moveRandomly(tree) {
    // It does not make sense to move a termination node
    const movedNode = this.#randomFrom(tree.nonPropertyNodes().filter((n) =>
      // Moves on some nodes do not make sense
      !n.isInnterruptLeafNode() &&
        !n.isRoot() &&
        !n.isParallelBranch() &&
        !n.isAlternative() &&
        !n.isOtherwise()));
    let parent;
    // chance for an interparent move
    if (this.#withProbability(0.8)) {
      // prevent move to self
      parent = this.#pickValidParent(
          movedNode,
          tree.inners()
              .filter((n) => !movedNode.toPreOrderArray().includes(n)),
      );
    } else {
      parent = movedNode.parent;
    }

    // only remove node if we found a valid parent
    movedNode.removeFromParent();

    this.#appendRandomly(parent, movedNode);
  }

  /**
   * Picks a valid parent node among a collection of inner nodes.
   * @param {Node} node The node for which a parent should be found.
   * @param {[Node]} inners The array of inner nodes from which the parent
   *     should be picked.
   * @return {Node|null} The parent node, if a suitable node could be found
   *     among the inner node array.
   * @private
   */
  #pickValidParent(node, inners) {
    // honor max width parameters as good as possible
    const filteredInners = inners.filter((n) => n.degree() < this.#genParams.maxDegree);
    if (filteredInners.length > 0) {
      // this would block
      inners = filteredInners;
    }

    // Some nodes are restricted in terms of their parent node
    let filterFun;
    if (node.isLeaf() && node.label === Dsl.ELEMENTS.STOP.label ||
        node.label === Dsl.ELEMENTS.TERMINATION.label ||
        node.label === Dsl.ELEMENTS.BREAK.label) {
      // multiple termination nodes under a single parent just do not make sense
      filterFun = (n) => n.label !== Dsl.ELEMENTS.PARALLEL.label &&
          n.label !== Dsl.ELEMENTS.CHOICE.label &&
          n.children.some((c) =>
              c.label === Dsl.ELEMENTS.STOP.label ||
              c.label === Dsl.ELEMENTS.TERMINATION.label ||
              c.label === Dsl.ELEMENTS.BREAK.label);
    } else if (node.isInnerNode() && node.label === Dsl.ELEMENTS.ALTERNATIVE.label) {
      filterFun = (n) => n.label === Dsl.ELEMENTS.CHOICE.label;
    } else if (node.isInnerNode() && node.label === Dsl.ELEMENTS.OTHERWISE.label) {
      // find a choose node with no existing otherwise branch
      filterFun = (n) => {
        if (n.label !== Dsl.ELEMENTS.CHOICE.label) return false;
        for (const child of n) {
          if (child.label === Dsl.ELEMENTS.OTHERWISE.label) return false;
        }
        return true;
      };
    } else if (node.isInnerNode() && node.label === Dsl.ELEMENTS.PARALLEL_BRANCH.label) {
      filterFun = (n) => n.label === Dsl.ELEMENTS.PARALLEL.label;
    } else {
      filterFun = (n) => n.label !== Dsl.ELEMENTS.PARALLEL.label &&
          n.label !== Dsl.ELEMENTS.CHOICE.label;
    }

    // pick parent according to filter function
    const parent = this.#randomFrom(inners.filter(filterFun));
    if (parent == null) {
      // error is handled by caller
      throw new Error('No valid parent left');
    }
    return parent;
  }

  /**
   * @param {Number} max The (exclusive) ceiling for the random integer.
   * @return {number} A random integer from 0 (inclusive) up to a max value
   *     (exclusive).
   * @private
   */
  #randInt(max) {
    return Math.floor(Math.random() * max);
  }

  /**
   * Generates a new alternative node with random condition.
   * @return {Node} A new <alternative> node
   * @private
   */
  #randomAlternative() {
    const node = new Node(Dsl.ELEMENTS.ALTERNATIVE.label);

    // random condition on single variable
    const readVariable = this.#randomFrom(this.#variables);
    node.attributes.set(
        Dsl.INNER_PROPERTIES.CONDITION.label,
        Config.VARIABLE_PREFIX + readVariable + ' < 69',
    );

    return node;
  }

  /**
   * @return {Node} A new <escape> node
   * @private
   */
  #randomBreak() {
    const node = new Node(Dsl.ELEMENTS.BREAK.label);
    return node;
  }

  /**
   * Generate a new service call node with random endpoint, label, arguments,
   * method, and read/written variables.
   * @return {Node} The random <call> node.
   * @private
   */
  #randomCall() {
    const node = new Node(Dsl.ELEMENTS.CALL.label);
    node.attributes.set(
        Dsl.CALL_PROPERTIES.ENDPOINT.label,
        this.#randomFrom(this.#endpoints),
    );

    const parameters = new Node(Dsl.CALL_PROPERTIES.PARAMETERS.label);

    // random label
    const label = new Node(Dsl.CALL_PROPERTIES.LABEL.label);
    // TODO label shouldnt be random
    label.text = this.#randomFrom(this.#labels);
    parameters.appendChild(label);

    // random method
    const method = new Node(Dsl.CALL_PROPERTIES.METHOD.label);
    method.text = this.#randomFrom(Dsl.ENDPOINT_METHODS);
    parameters.appendChild(method);

    // random service call arguments
    const args = new Node(Dsl.CALL_PROPERTIES.ARGUMENTS.label);
    for (const readVariable of this.#randomSubSet(
        this.#variables,
        this.#randInt(this.#genParams.maxVars),
    )) {
      const arg = new Node(readVariable);
      arg.text = Config.VARIABLE_PREFIX + readVariable;
      args.appendChild(arg);
    }
    if (args.hasChildren()) {
      parameters.appendChild(args);
    }
    node.appendChild(parameters);

    // random written variables
    const code = new Node(Dsl.CALL_PROPERTIES.CODE.label);
    const finalize = new Node(Dsl.CALL_PROPERTIES.FINALIZE.label);
    finalize.text = '';
    for (const writtenVariable of this.#randomSubSet(
        this.#variables,
        this.#randInt(this.#genParams.maxVars),
    )) {
      finalize.text += Config.VARIABLE_PREFIX + writtenVariable + ' = 420;';
    }

    // random read variables in code
    for (const readVariable of this.#randomSubSet(
        this.#variables,
        this.#randInt(this.#genParams.maxVars),
    )) {
      finalize.text += 'fun(data.' + readVariable + ');';
    }
    if (finalize.text !== '') {
      code.appendChild(finalize);
    }
    if (code.hasChildren()) {
      node.appendChild(code);
    }

    return node;
  }

  /**
   * Generates a new choice node with random mode.
   * @return {Node} A new <choose> node
   * @private
   */
  #randomChoice() {
    const node = new Node(Dsl.ELEMENTS.CHOICE.label);
    if (this.#withProbability(0.5)) {
      node.attributes.set(
          Dsl.INNER_PROPERTIES.CHOOSE_MODE.label,
          this.#randomFrom(Dsl.INNER_PROPERTIES.CHOOSE_MODE.options),
      );
    }
    return node;
  }

  /**
   * @return {Node} A new <critical> node
   * @private
   */
  #randomCritical() {
    const node = new Node(Dsl.ELEMENTS.CRITICAL.label);
    return node;
  }

  /**
   * Choose a random element from a given collection.
   * @param {Array|Set} collection The collection to be chosen from.
   * @return {?Object} A random element from the collection, if there exist any.
   * @private
   */
  #randomFrom(collection) {
    if (collection.constructor === Set) {
      let i = 0;
      const randIndex = this.#randInt(collection.size);
      for (const element of collection) {
        if (i === randIndex) return element;
        i++;
      }
    }
    if (collection.constructor === Array) {
      return collection[this.#randInt(collection.length)];
    }
  }

  /**
   * @return {Node} A random inner node from the CPEE DSL
   * @private
   */
  #randomInner() {
    // inner nodes are evenly distributed (except root node)
    const label = this.#randomFrom(new Array(...Dsl.INNER_NODE_SET.values()).filter(
        (n) => n !== Dsl.ELEMENTS.DSL_ROOT.label));
    switch (label) {
      case Dsl.ELEMENTS.LOOP.label:
        return this.#randomLoop();
      case Dsl.ELEMENTS.CHOICE.label:
        return this.#randomChoice();
      case Dsl.ELEMENTS.PARALLEL.label:
        return this.#randomParallel();
      case Dsl.ELEMENTS.CRITICAL.label:
        return this.#randomCritical();
      case Dsl.ELEMENTS.PARALLEL_BRANCH.label:
        return this.#randomParallelBranch();
      case Dsl.ELEMENTS.ALTERNATIVE.label:
        return this.#randomAlternative();
      case Dsl.ELEMENTS.OTHERWISE.label:
        return this.#randomOtherwise();
      default:
        throw new Error('Unknown inner node label ' + label);
    }
  }

  /**
   * @return {Node} A random leaf node from the CPEE DSL
   * @private
   */
  #randomLeaf() {
    let node;
    // about two-third chance to add a call
    if (this.#withProbability(0.7)) {
      node = this.#randomCall();
    } else if (this.#withProbability(0.9)) {
      node = this.#randomScript();
    } else if (this.#withProbability(0.3)) {
      node = this.#randomStop();
    } else if (this.#withProbability(0.3)) {
      node = this.#randomBreak();
    } else {
      node = this.#randomTermination();
    }
    return node;
  }

  /**
   * Generates a new loop node with random condition.
   * @return {Node} A new <loop> node
   * @private
   */
  #randomLoop() {
    const node = new Node(Dsl.ELEMENTS.LOOP.label);
    // random condition
    const readVariable = this.#randomFrom(this.#variables);
    node.attributes.set(
        Dsl.INNER_PROPERTIES.CONDITION.label,
        Config.VARIABLE_PREFIX + readVariable + ' < 69',
    );

    if (this.#withProbability(0.5)) {
      // random mode
      node.attributes.set(
          Dsl.INNER_PROPERTIES.LOOP_MODE.label,
          this.#randomFrom(Dsl.INNER_PROPERTIES.LOOP_MODE.options),
      );
    }
    return node;
  }

  /**
   * @return {Node} A new <otherwise> node
   * @private
   */
  #randomOtherwise() {
    const node = new Node(Dsl.ELEMENTS.OTHERWISE.label);
    return node;
  }

  /**
   * @return {Node} A new <parallel> node
   * @private
   */
  #randomParallel() {
    const node = new Node(Dsl.ELEMENTS.PARALLEL.label);
    if (this.#withProbability(0.5)) {
      node.attributes.set(
          Dsl.INNER_PROPERTIES.PARALLEL_WAIT.label,
          Dsl.INNER_PROPERTIES.PARALLEL_WAIT.default,
      );

      node.attributes.set(
          Dsl.INNER_PROPERTIES.PARALLEL_CANCEL.label,
          this.#randomFrom(Dsl.INNER_PROPERTIES.PARALLEL_CANCEL.options),
      );
    }
    return node;
  }

  /**
   * @return {Node} A new <parallel_branch> node
   * @private
   */
  #randomParallelBranch() {
    const node = new Node(Dsl.ELEMENTS.PARALLEL_BRANCH.label);
    return node;
  }

  /**
   * @return {Node} A new root node
   * @private
   */
  #randomRoot() {
    return new Node(Dsl.ELEMENTS.DSL_ROOT.label);
  }

  /**
   * Generate a new script node with random read/written variables.
   * @return {Node} The random <manipulate> node.
   * @private
   */
  #randomScript() {
    const node = new Node(Dsl.ELEMENTS.SCRIPT.label);

    // random written #variables
    node.text = '';
    for (const writtenVariable of this.#randomSubSet(
        this.#variables,
        this.#randInt(this.#genParams.maxVars),
    )) {
      node.text += Config.VARIABLE_PREFIX + writtenVariable + ' = 420;';
    }
    for (const readVariable of this.#randomSubSet(
        this.#variables,
        this.#randInt(this.#genParams.maxVars),
    )) {
      node.text += 'fun(data.' + readVariable + ');';
    }

    return node;
  }

  /**
   * @return {Node} A new <stop> node
   * @private
   */
  #randomStop() {
    const node = new Node(Dsl.ELEMENTS.STOP.label);
    return node;
  }

  /**
   * Generate a random string from a given alphabet.
   * @param {Number} length The desired length of the string.
   * @return {String} The random string.
   * @private
   */
  #randomString(length = this.#randInt(100)) {
    const result = [];
    // include underscore (dollar sign is an invalid XML tag name)
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_';
    for (let i = 0; i < length; i++) {
      result.push(characters.charAt(this.#randInt(characters.length)));
    }
    return result.join('');
  }

  /**
   * Choose a random subset of fixed size from the elements of a collection.
   * @param {Array|Set} collection The collection to be chosen from.
   * @param {Number} amount The desired number of elements in the subset. The
   *     returned subset may contain less elements.
   * @return {Set<*>} The random subset.
   * @private
   */
  #randomSubSet(collection, amount) {
    const res = [];
    for (let i = 0; i < amount; i++) {
      res.push(this.#randomFrom(collection));
    }
    return new Set(res);
  }

  /**
   * @return {Node} A new <terminate> node
   * @private
   */
  #randomTermination() {
    const node = new Node(Dsl.ELEMENTS.TERMINATION.label);
    return node;
  }

  /**
   * Generate a random process tree using the specified parameters and random
   * endpoints, labels, and variables. The resulting process tree should
   * conform to the CPEE specification (syntactic correctness).
   * @param {Node} root Specify an optional root node for the tree. By default,
   *     a new root is generated.
   * @return {Node} The root node of the generated process tree
   */
  randomTree(root = this.#randomRoot()) {
    Logger.info(
        'Generating random process tree with parameters ' + this.#genParams.toString() + '...',
        this,
    );
    Logger.startTimed();
    // The inner nodes, from which a new parent node is picked at each extension
    // step
    const inners = [root];
    let currSize = 1;
    while (currSize < this.#genParams.size) {
      let newNode;
      // TODO export probabilities to generator params
      // Pick a leaf node or inner node with a certain probability
      if (this.#withProbability(0.6)) {
        newNode = this.#randomLeaf();
      } else {
        newNode = this.#randomInner();
      }

      try {
        // Find a valid parent node from the current inner node set
        const parent = this.#pickValidParent(newNode, inners);

        if (newNode.isInnerNode()) {
          inners.push(newNode);
        }

        this.#appendRandomly(parent, newNode);
        currSize += newNode.size();
      } catch (error) {
        // TODO
      }
    }

    // preprocess and prune empty nodes
    const preparedTree = new Preprocessor().preprocess(root);
    Logger.stat('Tree generation took ' + Logger.endTimed() + 'ms', this);
    return preparedTree;
  }

  /**
   * Change a tree by updating a random node.
   * @param {Node} tree The tree to be changed.
   * @private
   */
  #updateRandomly(tree) {
    let node;
    // Updates can target text content or attributes
    if (this.#withProbability(0.6)) {
      // Change text
      node = this.#randomFrom(tree.toPreOrderArray()
          .filter((node) => node.text != null));
      switch (node.label) {
        case Dsl.CALL_PROPERTIES.LABEL.label: {
          if (this.#withProbability(0.5)) {
            // shrink label
            node.text = node.text.substring(this.#randInt(node.text.length));
          }
          if (this.#withProbability(0.5)) {
            // extend label
            node.text += this.#randomString(10);
          }
          break;
        }
        case Dsl.CALL_PROPERTIES.METHOD.label: {
          node.text = this.#randomFrom(Dsl.ENDPOINT_METHODS);
          break;
        }
        case Dsl.CALL_PROPERTIES.PREPARE.label:
        case Dsl.CALL_PROPERTIES.UPDATE.label:
        case Dsl.CALL_PROPERTIES.RESCUE.label:
        case Dsl.CALL_PROPERTIES.FINALIZE.label:
        case Dsl.ELEMENTS.SCRIPT.label: {
          // code change, split into statements
          const statements = node.text.split(';');
          // remove a random statement
          if (this.#withProbability(0.5)) {
            statements.splice(this.#randInt(statements.length), 1);
          }
          // insert a new one
          if (this.#withProbability(0.33)) {
            // modify new variable
            const newModVariable = this.#randomFrom(this.#variables);
            statements.push(Config.VARIABLE_PREFIX + newModVariable +
                ' = ' + this.#randInt(1000));
          } else if (this.#withProbability(0.5)) {
            // read new variable
            const newReadVariable = this.#randomFrom(this.#variables);
            statements.push('fun(' + Config.VARIABLE_PREFIX +
                newReadVariable + ')');
          } else {
            // read and write to new variable
            const newVariable = this.#randomFrom(this.#variables);
            statements.push(Config.VARIABLE_PREFIX + newVariable + '++');
          }
          node.text = statements.join(';') + ';';
          break;
        }
        default: {
          node.text += this.#randomString(10);
        }
      }
    } else {
      node = this.#randomFrom(tree.nonPropertyNodes()
          .filter((n) => n.hasAttributes()));
      const key =
          this.#randomFrom(Array.of(...node.attributes.keys()));
      switch (key) {
        case Dsl.CALL_PROPERTIES.ENDPOINT.label: {
          // change endpoint
          node.attributes.set(
              Dsl.CALL_PROPERTIES.ENDPOINT.label,
              this.#randomFrom(this.#endpoints),
          );
          break;
        }
        case Dsl.INNER_PROPERTIES.CHOOSE_MODE.label: {
          // change choose mode
          const chooseMode = node.attributes.get(key);
          node.attributes.set(
              key,
              this.#randomFrom(Dsl.INNER_PROPERTIES.CHOOSE_MODE.options
                  .filter((option) => option !== chooseMode)),
          );
          break;
        }
        case Dsl.INNER_PROPERTIES.LOOP_MODE.label: {
          // change choose mode
          const loopMode = node.attributes.get(key);
          node.attributes.set(
              key,
              this.#randomFrom(Dsl.INNER_PROPERTIES.LOOP_MODE.options
                  .filter((option) => option !== loopMode)),
          );
          break;
        }
        case Dsl.INNER_PROPERTIES.PARALLEL_WAIT.label: {
          // change wait number
          let wait = parseInt(node.attributes.get(key));
          wait++;
          node.attributes.set(key, wait.toString());
          break;
        }
        case Dsl.INNER_PROPERTIES.PARALLEL_CANCEL.label: {
          // change cancel mode
          const parallelCancel = node.attributes.get(key);
          node.attributes.set(
              key,
              this.#randomFrom(Dsl.INNER_PROPERTIES.PARALLEL_CANCEL.options
                  .filter((option) => option !== parallelCancel)),
          );
          break;
        }
        case Dsl.INNER_PROPERTIES.CONDITION.label: {
          // add additional read variable
          node.attributes.set(
              key,
              node.attributes.get(key) +
              ' && ' + this.#randomFrom(this.#variables) + ' > 0',
          );
          break;
        }
        default: {
          if (this.#withProbability(0.6)) {
            // 60% chance to change string value
            const oldVal = node.attributes.get(key);
            node.attributes.set(
                key,
                oldVal + this.#randomString(10),
            );
          } else {
            // Otherwise, delete the attribute
            node.attributes.delete(key);
          }
        }
      }
    }
    // There's a chance to insert a new random attribute, regardless of the
    // applied update
    if (this.#withProbability(0.4)) {
      node.attributes.set(this.#randomString(10), this.#randomString(10));
    }
  }

  /**
   * @param {Number} prob A probability value from [0,1].
   * @return {boolean} True with a chance equal to the probability value.
   * @private
   */
  #withProbability(prob) {
    return Math.random() < prob;
  }
}

