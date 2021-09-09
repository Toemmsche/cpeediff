import {Node} from '../../tree/Node.js';
import {Preprocessor} from '../../io/Preprocessor.js';
import {Dsl} from '../../config/Dsl.js';
import {ExpectedDiff} from '../expected/ExpectedDiff.js';
import {DiffConfig} from '../../config/DiffConfig.js';
import {Logger} from '../../util/Logger.js';
import {GeneratorParameters} from './GeneratorParameters.js';
import {Matching} from '../../diff/match/Matching.js';
import {EditScriptGenerator} from '../../diff/delta/EditScriptGenerator.js';
import {DiffTestCase} from '../case/DiffTestCase.js';
import {IdExtractor} from '../../extract/IdExtractor.js';
import {ElementSizeExtractor} from '../../extract/ElementSizeExtractor.js';
import {GenMatchTestCase} from '../case/GenMatchTestCase.js';
import {ExpectedGenMatching} from '../expected/ExpectedGenMatching.js';

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
   * The distribution of inner nodes.
   * @type {Array<String>}
   * @private
   * @const
   */
  #innerDistribution;
  /**
   * The distribution of leaf nodes.
   * @type {Array<String>}
   * @private
   * @const
   */
  #leafDistribution;

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

    // About 2*log_2(n) (at least 5 or maxVars) variables, labels, and
    // endpoints to choose from
    for (let i = 0; i < Math.max(
        this.#genParams.maxVars,
        2 * Math.log2(this.#genParams.size),
        5,
    ); i++) {
      this.#endpoints.push(this.#randomString(this.#randInt(20) + 10));
      this.#labels.push(this.#randomString(this.#randInt(30) + 10));
      this.#variables.push(this.#randomString(this.#randInt(10) + 5));
    }

    // Set up inner and leaf node distribution
    this.#leafDistribution = this.#distribution(
        [
          [
            Dsl.ELEMENTS.CALL.label,
            30,
          ],
          [
            Dsl.ELEMENTS.SCRIPT.label,
            20,
          ],
          [
            Dsl.ELEMENTS.BREAK.label,
            1,
          ],
          [
            Dsl.ELEMENTS.TERMINATION.label,
            1,
          ],
          [
            Dsl.ELEMENTS.STOP.label,
            1,
          ],
        ],
    );
    this.#innerDistribution = this.#distribution(
        [
          [
            Dsl.ELEMENTS.LOOP.label,
            2,
          ],
          [
            Dsl.ELEMENTS.CHOICE.label,
            1,
          ],
          [
            Dsl.ELEMENTS.ALTERNATIVE.label,
            2,
          ],
          [
            Dsl.ELEMENTS.OTHERWISE.label,
            1,
          ],
          [
            Dsl.ELEMENTS.PARALLEL.label,
            1,
          ],
          [
            Dsl.ELEMENTS.PARALLEL_BRANCH.label,
            2,
          ],
          [
            Dsl.ELEMENTS.CRITICAL.label,
            1,
          ],
        ],
    );
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
   * amount of changes can be specified. Returns a diff test case containing
   * the old and changed tree.
   * @param {Node} tree The root node of the tree to be changed.
   * @param {ChangeParameters} changeParams A set of parameters for the
   *     changes.
   * @return {[DiffTestCase, GenMatchTestCase]}} An array containing the
   *     corresponding diff and gen match test case.
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
    const distribution = this.#distribution(
        [
          [
            Dsl.CHANGE_MODEL.INSERTION.label,
            changeParams.insertionWeight,
          ],
          [
            Dsl.CHANGE_MODEL.MOVE.label,
            changeParams.moveWeight,
          ],
          [
            Dsl.CHANGE_MODEL.UPDATE.label,
            changeParams.updateWeight,
          ],
          [
            Dsl.CHANGE_MODEL.DELETION.label,
            changeParams.deletionWeight,
          ],
        ],
    );

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
    let skipped = 0;
    for (let i = 0; i < changeParams.totalChanges; i++) {
      const opType = this.#randomFrom(distribution);
      try {
        switch (opType) {
          case Dsl.CHANGE_MODEL.INSERTION.label: {
            // we can insert a subtree, a leaf node, or a property node (only
            // call arguments are supported)
            if (this.#withProbability(0.2)) {
              this.#insertSubtreeRandomly(newTree);
            } else if (this.#withProbability(0.75)) {
              this.#insertLeafRandomly(newTree);
            } else {
              this.#insertArgRandomly(newTree);
            }
            break;
          }
          case Dsl.CHANGE_MODEL.DELETION.label: {
            if (this.#withProbability(0.2)) {
              this.#deleteSubtreeRandomly(newTree);
            } else if (this.#withProbability(0.75)) {
              this.#deleteLeafRandomly(newTree);
            } else {
              this.#deleteArgRandomly(newTree);
            }
            break;
          }
          case Dsl.CHANGE_MODEL.MOVE.label: {
            this.#moveRandomly(newTree);
            break;
          }
          case Dsl.CHANGE_MODEL.UPDATE.label: {
            this.#updateRandomly(newTree);
            break;
          }
        }
      } catch (e) {
        skipped++;
      }
    }
    if (skipped > 0) {
      Logger.warn(
          skipped + ' edit operation(s) could not be applied',
          this,
      );
    }
    if (changeParams.local) {
      // reset newTree if changes were local
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
        '[Size: ' + Math.max(
            original.size(),
            newTree.size(),
        ) + ', Changes: ' + proposedEditScript.size() + ']',
        original,
        newTree,
        new ExpectedDiff(proposedEditScript),
    );

    const matchTestCase = new GenMatchTestCase(
        testCase.name,
        testCase.oldTree,
        testCase.newTree,
        new ExpectedGenMatching(returnMatching),
    );

    Logger.stat('Changing tree took ' + Logger.endTimed() + 'ms', this);
    return [
      testCase,
      matchTestCase,
    ];
  }

  /**
   * Change a process tree by randomly deleting the argument of a <call> node.
   * @param {Node} tree The root the process tree to change.
   */
  #deleteArgRandomly(tree) {
    const arg = tree
        .toPreOrderArray()
        .filter((node) => node.parent.isCallArguments());
    arg.removeFromParent();
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
   * Set up a distribution that respects the weight of each item.
   * The probability to randomly choose x is w_x / sum(w_*).
   * @param {Array<[Object, Number]>} weightedItems The items their weights.
   * @return {Array<Object>} The desired distribution array.
   * @private
   */
  #distribution(weightedItems) {
    let distribution = [];
    for (const weightedItem of weightedItems) {
      distribution = distribution.concat(
          new Array(weightedItem[1]).fill(weightedItem[0]));
    }
    return distribution;
  }

  /**
   * Change a tree by adding a random argument to an existing service call node.
   * @param {Node} tree The tree to be changed.
   * @private
   */
  #insertArgRandomly(tree) {
    const parent = this.#randomFrom(tree.toPreOrderArray()
        .filter((node) => node.isCallArguments()));
    let insertedArg = this.#randomFrom(this.#variables);
    insertedArg = new Node(
        insertedArg,
        DiffConfig.VARIABLE_PREFIX + insertedArg,
    );
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
      const descendantSet = new Set(movedNode.toPreOrderArray());
      parent = this.#pickValidParent(
          movedNode,
          tree.inners()
              .filter((inner) => !descendantSet.has(inner)),
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
   * @param {Array<Node>} inners The array of inner nodes from which the parent
   *     should be picked.
   * @return {?Node} The parent node, if a suitable node could be found
   *     among the inner node array.
   * @private
   */
  #pickValidParent(node, inners) {
    // honor max width parameters as good as possible
    const filteredInners = inners.filter((inner) =>
        inner.degree() < this.#genParams.maxDegree);
    if (filteredInners.length > 0) {
      // this would block
      inners = filteredInners;
    }

    // Some nodes are restricted in terms of their parent node
    let filterFun;
    if (node.isInnterruptLeafNode()) {
      // multiple termination nodes under a single parent just do not make sense
      filterFun = (inner) => !inner.isParallel() && !inner.isChoice() &&
          !inner.children.some((child) => child.isInnterruptLeafNode());
    } else if (node.isAlternative()) {
      filterFun = (inner) => inner.isChoice();
    } else if (node.isOtherwise()) {
      // find a choose node with no existing otherwise branch
      filterFun = (inner) => inner.isChoice() &&
          !inner.children.some((child) => child.isOtherwise());
    } else if (node.isParallelBranch()) {
      filterFun = (inner) => inner.isParallel();
    } else {
      filterFun = (inner) => !inner.isParallel() && !inner.isChoice();
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
   * @return {Number} A random integer from 0 (inclusive) up to a max value
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
        DiffConfig.VARIABLE_PREFIX + readVariable + ' < ' + this.#randInt(1000),
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

    // Random endpoint
    node.attributes.set(
        Dsl.CALL_PROPERTIES.ENDPOINT.label,
        this.#randomFrom(this.#endpoints),
    );

    const parameters = new Node(Dsl.CALL_PROPERTIES.PARAMETERS.label);

    // Not all calls are guaranteed to have a label
    if (this.#withProbability(0.75)) {
      const label = new Node(Dsl.CALL_PROPERTIES.LABEL.label);
      // TODO label shouldnt be random
      label.text = this.#randomFrom(this.#labels);
      parameters.appendChild(label);
    }

    // Random method
    const method = new Node(Dsl.CALL_PROPERTIES.METHOD.label);
    method.text = this.#randomFrom(Dsl.ENDPOINT_METHODS);
    parameters.appendChild(method);

    // Random service call arguments
    const args = new Node(Dsl.CALL_PROPERTIES.ARGUMENTS.label);
    const argKeySet = this.#randomSubSet(
        this.#variables,
        this.#randInt(this.#genParams.maxVars),
    );
    // Chance to have arg that is not a variable
    if (this.#withProbability(0.2)) {
      argKeySet.add(this.#randomString(20));
    }
    for (const argKey of argKeySet) {
      const arg = new Node(argKey);
      // Chance for constant arg value (
      if (this.#withProbability(0.2) || !this.#variables.includes(argKey)) {
        arg.text = this.#randomString(20);
      } else {
        arg.text = DiffConfig.VARIABLE_PREFIX + argKey;
      }
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
      finalize.text += DiffConfig.VARIABLE_PREFIX + writtenVariable + ' = ' +
          this.#randInt(1000) + ';';
    }

    // random read variables in code
    for (const readVariable of this.#randomSubSet(
        this.#variables,
        this.#randInt(this.#genParams.maxVars),
    )) {
      finalize.text += 'fun(data.' + readVariable + ');';
    }
    if (finalize.hasText()) {
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

    // Chance to explicitly set the mode
    if (this.#withProbability(0.5)) {
      node.attributes.set(
          Dsl.INNER_PROPERTIES.CHOICE_MODE.label,
          this.#randomFrom(Dsl.INNER_PROPERTIES.CHOICE_MODE.options),
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
    const label = this.#randomFrom(this.#innerDistribution);
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
    const label = this.#randomFrom(this.#leafDistribution);
    switch (label) {
      case Dsl.ELEMENTS.CALL.label:
        return this.#randomCall();
      case Dsl.ELEMENTS.SCRIPT.label:
        return this.#randomScript();
      case Dsl.ELEMENTS.TERMINATION.label:
        return this.#randomTermination();
      case Dsl.ELEMENTS.STOP.label:
        return this.#randomStop();
      case Dsl.ELEMENTS.BREAK.label:
        return this.#randomBreak();
      default:
        throw new Error('Unknown leaf node label');
    }
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
        DiffConfig.VARIABLE_PREFIX + readVariable + ' < ' + this.#randInt(1000),
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
      node.text += DiffConfig.VARIABLE_PREFIX + writtenVariable + ' = ' +
          this.#randInt(1000) + ';';
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
        'Generating random process tree with parameters ' +
        this.#genParams.toString() + '...',
        this,
    );
    Logger.startTimed();
    // The inner nodes, from which a new parent node is picked at each extension
    // step
    const inners = [root];
    let currSize = 1;
    while (currSize < 0.98 * this.#genParams.size) {
      while (currSize <= this.#genParams.size) {
        let newNode;
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
          //
        }
      }
      // Preprocess to obtain a well-formed tree
      const loggingEnabled = Logger.disableLogging();
      root = new Preprocessor().preprocess(root);
      currSize = root.size();
      if (loggingEnabled) {
        Logger.enableLogging();
      }
    }
    Logger.stat('Tree generation for size ' + currSize +
        ' took ' + Logger.endTimed() + 'ms', this);
    return root;
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
            statements.push(DiffConfig.VARIABLE_PREFIX + newModVariable +
                ' = ' + this.#randInt(1000));
          } else if (this.#withProbability(0.5)) {
            // read new variable
            const newReadVariable = this.#randomFrom(this.#variables);
            statements.push('fun(' + DiffConfig.VARIABLE_PREFIX +
                newReadVariable + ')');
          } else {
            // read and write to new variable
            const newVariable = this.#randomFrom(this.#variables);
            statements.push(DiffConfig.VARIABLE_PREFIX + newVariable + '++');
          }
          node.text = (statements.join(';') + ';').replaceAll(/;*/, ';');
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
        case Dsl.INNER_PROPERTIES.CHOICE_MODE.label: {
          // change choose mode
          if (node.isChoice()) {
            const chooseMode = node.attributes.get(key);
            node.attributes.set(
                key,
                this.#randomFrom(Dsl.INNER_PROPERTIES.CHOICE_MODE.options
                    .filter((option) => option !== chooseMode)),
            );
          } else if (node.isLoop()) {
            // change loop mode
            const loopMode = node.attributes.get(key);
            node.attributes.set(
                key,
                this.#randomFrom(Dsl.INNER_PROPERTIES.LOOP_MODE.options
                    .filter((option) => option !== loopMode)),
            );
          }
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
   * @return {Boolean} True with a chance equal to the probability value.
   * @private
   */
  #withProbability(prob) {
    return Math.random() < prob;
  }
}

