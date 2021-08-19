import {CallPropertyExtractor} from '../extract/CallPropertyExtractor.js';
import {VariableExtractor} from '../extract/VariableExtractor.js';
import {SizeExtractor} from '../extract/SizeExtractor.js';
import {Dsl} from '../Dsl.js';
import {Config} from '../Config.js';
import {ElementSizeExtractor} from '../extract/ElementSizeExtractor.js';
import {getLcs} from '../lib/Lcs.js';
import {HashExtractor} from '../extract/HashExtractor.js';

/**
 * Wrapper class for the computation of various comparison values.
 */
export class Comparator {
  /** @type {CallPropertyExtractor} */
  #callPropertyExtractor;
  /** @type {VariableExtractor} */
  #variableExtractor;
  /** @type {SizeExtractor} */
  #sizeExtractor;
  /** @type {ElementSizeExtractor} */
  #elementSizeExtractor;
  /** @type {HashExtractor} */
  #hashExtractor;

  /**
   * Create a new Comparator instance.
   */
  constructor() {
    this.#callPropertyExtractor = new CallPropertyExtractor();
    this.#variableExtractor =
        new VariableExtractor(this.#callPropertyExtractor);
    this.#sizeExtractor = new SizeExtractor();
    this.#elementSizeExtractor = new ElementSizeExtractor();
    this.#hashExtractor = new HashExtractor();
  }

  /**
   * Compare content and composition of two nodes.
   * @param {Node} nodeA
   * @param {Node} nodeB
   * @return {Number} The comparison value from the range [0;1]
   */
  compare(nodeA, nodeB) {
    const compareValue = this.weightedAverage(
        [
          this.compareContent(nodeA, nodeB),
          this.comparePosition(nodeA, nodeB),
        ],
        [
          Config.COMPARATOR.CONTENT_WEIGHT,
          Config.COMPARATOR.POSITION_WEIGHT,
        ]);
    return compareValue;
  }

  /**
   * Compare the content of two Alternatives.
   * @param {Node} alternativeA
   * @param {Node} alternativeB
   * @return {?Number} The content comparison value from the range [0;1]
   */
  #compareAlternativeContent(alternativeA, alternativeB) {
    let readVariablesCV =
        this.#compareReadVariables(alternativeA, alternativeB);

    const conditionA =
        alternativeA.attributes.has(Dsl.INNER_PROPERTIES.CONDITION.label) ?
            alternativeA.attributes.get(Dsl.INNER_PROPERTIES.CONDITION.label) :
            Dsl.INNER_PROPERTIES.CONDITION.default;
    const conditionB =
        alternativeB.attributes.has(Dsl.INNER_PROPERTIES.CONDITION.label) ?
            alternativeB.attributes.get(Dsl.INNER_PROPERTIES.CONDITION.label) :
            Dsl.INNER_PROPERTIES.CONDITION.default;
    if (readVariablesCV != null && conditionA !== conditionB) {
      // small penalty for code string inequality
      readVariablesCV += Config.COMPARATOR.EPSILON_PENALTY;
    } else if (conditionA != null || conditionB != null) {
      // All-or-nothing comparison if code doesn't access any variables
      readVariablesCV = conditionA === conditionB ? 0 : 1;
    }
    // readVariablesCV may be null
    const contentCV = this.weightedAverage([readVariablesCV],
        [Config.COMPARATOR.CONDITION_WEIGHT], 0);

    return contentCV;
  }

  /**
   * Compare the content of two Calls.
   * @param {Node} callA
   * @param {Node} callB
   * @return {Number} The content comparison value from the range [0;1]
   */
  #compareCallContent(callA, callB) {
    // Extract properties
    const propsA = this.#callPropertyExtractor.get(callA);
    const propsB = this.#callPropertyExtractor.get(callB);

    // The endpoint URL has to match exactly for a perfect comparison value
    const endPointCV = propsA.endpoint === propsB.endpoint ? 0 : 1;
    const labelCV = this.compareString(propsA.label, propsB.label);
    const methodCV = propsA.method === propsB.method ? 0 : 1;
    const argCV = this.compareLcs(propsA.args, propsB.args);

    const serviceCallCV = this.weightedAverage(
        [
          endPointCV,
          labelCV,
          methodCV,
          argCV,
        ],
        [
          Config.COMPARATOR.CALL_ENDPOINT_WEIGHT,
          Config.COMPARATOR.CALL_LABEL_WEIGHT,
          Config.COMPARATOR.CALL_METHOD_WEIGHT,
          Config.COMPARATOR.CALL_ARGS_WEIGHT,
        ]);
    // If the endpoint (including method, label and arguments) of two calls
    // perfectly matches, we can assume they fulfill the same semantic purpose
    if (serviceCallCV === 0) {
      return serviceCallCV;
    }

    let codeCV = null;

    // Compare written and read variables
    const writtenVariablesCV = this.#compareWrittenVariables(callA, callB);
    const readVariablesCV = this.#compareReadVariables(callA, callB);

    // Weigh comparison values
    codeCV = this.weightedAverage(
        [
          writtenVariablesCV,
          readVariablesCV,
        ],
        [
          Config.COMPARATOR.WRITTEN_VAR_WEIGHT,
          Config.COMPARATOR.READ_VAR_WEIGHT,
        ]);
    if (codeCV !== null && propsA.code !== propsB.code) {
      // Small penalty for code string inequality
      codeCV += Config.COMPARATOR.EPSILON_PENALTY;
    } else if (propsA.hasCode() || propsB.hasCode()) {
      // All-or-nothing comparison if code doesn't access any variables
      codeCV = propsA.code === propsB.code ? 0 : 1;
    }
    const contentCV = this.weightedAverage(
        [
          serviceCallCV,
          codeCV,
        ],
        [
          Config.COMPARATOR.CALL_SERVICE_WEIGHT,
          Config.COMPARATOR.CALL_CODE_WEIGHT,
        ]);
    return contentCV;
  }

  /**
   * Compare the content of two Choices.
   * @param {Node} choiceA
   * @param {Node} choiceB
   * @return {Number} The content comparison value from the range [0;1]
   */
  #compareChoiceContent(choiceA, choiceB) {
    const modeA =
        choiceA.attributes.has(Dsl.INNER_PROPERTIES.CHOOSE_MODE.label) ?
            choiceB.attributes.get(Dsl.INNER_PROPERTIES.CHOOSE_MODE.label) :
            Dsl.INNER_PROPERTIES.CHOOSE_MODE.default;
    const modeB =
        choiceB.attributes.has(Dsl.INNER_PROPERTIES.CHOOSE_MODE.label) ?
            choiceB.attributes.get(Dsl.INNER_PROPERTIES.CHOOSE_MODE.label) :
            Dsl.INNER_PROPERTIES.CHOOSE_MODE.default;

    // all or nothing
    const modeCV = modeA === modeB ? 0 : 1;

    const contentCV = modeCV;

    return contentCV;
  }

  /**
   * Compare the content of two nodes.
   * @param {Node} nodeA
   * @param {Node} nodeB
   * @return {Number} The content comparison value from the range [0;1]
   */
  compareContent(nodeA, nodeB) {
    // different labels cannot be matched
    if (nodeA.label !== nodeB.label) return 1.0;
    switch (nodeA.label) {
      case Dsl.ELEMENTS.CALL.label: {
        return this.#compareCallContent(nodeA, nodeB);
      }
      case Dsl.ELEMENTS.MANIPULATE.label: {
        return this.#compareScriptContent(nodeA, nodeB);
      }
      case Dsl.ELEMENTS.ALTERNATIVE.label: {
        return this.#compareAlternativeContent(nodeA, nodeB);
      }
      case Dsl.ELEMENTS.LOOP.label: {
        return this.#compareLoopContent(nodeA, nodeB);
      }
      case Dsl.ELEMENTS.PARALLEL.label: {
        return this.#compareParallelContent(nodeA, nodeB);
      }
      case Dsl.ELEMENTS.CHOOSE.label: {
        return this.#compareChoiceContent(nodeA, nodeB);
      }
      // Label equality is sufficient for parallel_branch, critical, otherwise,
      // and root...
      default: {
        return 0;
      }
    }
  }

  /**
   * Perform an LCS-based comparison between two sequences.
   * @param {Array<any>} seqA
   * @param {Array<any>} seqB
   * @param {?Number} defaultValue The result if the computation is invalid.
   * @return {?Number} The comparison value from the range [0;1]
   */
  compareLcs(seqA, seqB, defaultValue = null) {
    if (seqA == null || seqB == null) {
      return defaultValue;
    }
    const maxLength = Math.max(seqA.length, seqB.length);
    if (maxLength === 0) return defaultValue;
    return 1 - (getLcs(seqA, seqB).length / maxLength);
  }

  /**
   * Compare the content of two Loops.
   * @param {Node} loopA
   * @param {Node} loopB
   * @return {Number} The content comparison value from the range [0;1]
   */
  #compareLoopContent(loopA, loopB) {
    const modeA =
        loopA.attributes.has(Dsl.INNER_PROPERTIES.LOOP_MODE.label) ?
            loopA.attributes.get(Dsl.INNER_PROPERTIES.LOOP_MODE.label) :
            Dsl.INNER_PROPERTIES.LOOP_MODE.default;
    const modeB =
        loopB.attributes.has(Dsl.INNER_PROPERTIES.LOOP_MODE.label) ?
            loopB.attributes.get(Dsl.INNER_PROPERTIES.LOOP_MODE.label) :
            Dsl.INNER_PROPERTIES.LOOP_MODE.default;

    // all or nothing
    const modeCV = modeA === modeB ? 0 : 1;

    let readVariablesCV = this.#compareReadVariables(loopA, loopB);

    const conditionA =
        loopA.attributes.has(Dsl.INNER_PROPERTIES.CONDITION.label) ?
            loopA.attributes.get(Dsl.INNER_PROPERTIES.CONDITION.label) :
            Dsl.INNER_PROPERTIES.CONDITION.default;
    const conditionB =
        loopB.attributes.has(Dsl.INNER_PROPERTIES.CONDITION.label) ?
            loopB.attributes.get(Dsl.INNER_PROPERTIES.CONDITION.label) :
            Dsl.INNER_PROPERTIES.CONDITION.default;
    if (readVariablesCV != null && conditionA !== conditionB) {
      // small penalty for code string inequality
      readVariablesCV += Config.COMPARATOR.EPSILON_PENALTY;
    } else if (conditionA != null || conditionB != null) {
      // All-or-nothing comparison if code doesn't access any variables
      readVariablesCV = conditionA === conditionB ? 0 : 1;
    }

    const contentCV = this.weightedAverage(
        [
          modeCV,
          readVariablesCV,
        ],
        [
          Config.COMPARATOR.MODE_WEIGHT,
          Config.COMPARATOR.CONDITION_WEIGHT,
        ], 0);

    return contentCV;
  }

  /**
   * Compare the position of two nodes, determined by their paths.
   * @param {Node} parallelA
   * @param {Node} parallelB
   * @return {Number} The content comparison value from the range [0;1]
   */
  #compareParallelContent(parallelA, parallelB) {
    const waitA =
        parallelA.attributes.has(Dsl.INNER_PROPERTIES.PARALLEL_WAIT.label) ?
            parallelA.attributes.get(Dsl.INNER_PROPERTIES.PARALLEL_WAIT.label) :
            Dsl.INNER_PROPERTIES.PARALLEL_WAIT.default;
    const waitB =
        parallelB.attributes.has(Dsl.INNER_PROPERTIES.PARALLEL_WAIT.label) ?
            parallelB.attributes.get(Dsl.INNER_PROPERTIES.PARALLEL_WAIT.label) :
            Dsl.INNER_PROPERTIES.PARALLEL_WAIT.default;

    const cancelA =
        parallelA.attributes.has(Dsl.INNER_PROPERTIES.PARALLEL_CANCEL.label) ?
            parallelA.attributes
                .get(Dsl.INNER_PROPERTIES.PARALLEL_CANCEL.label) :
            Dsl.INNER_PROPERTIES.PARALLEL_CANCEL.default;
    const cancelB =
        parallelB.attributes.has(Dsl.INNER_PROPERTIES.PARALLEL_CANCEL.label) ?
            parallelB.attributes
                .get(Dsl.INNER_PROPERTIES.PARALLEL_CANCEL.label) :
            Dsl.INNER_PROPERTIES.PARALLEL_CANCEL.default;

    // all or nothing
    const modeCV = waitA === waitB && cancelA === cancelB ? 0 : 1;

    const contentCV = modeCV;

    return contentCV;
  }

  /**
   * Compare the position of two nodes, determined by their paths.
   * @param {Node} nodeA
   * @param {Node} nodeB
   * @return {Number} The positional comparison value from the range [0;1]
   */
  comparePosition(nodeA, nodeB) {
    const radius = Config.COMPARATOR.PATH_COMPARE_RANGE;

    /*
    const nodeLeftSlice = node.getSiblings().slice(Math.max(node.index - radiu
    s, 0), node.index).map(n => this.#hashExtractor.get(n));
    const otherLeftSlice = other.getSiblings().slice(Math.max(other.index - ra
    dius, 0), other.index).map(n => this.#hashExtractor.get(n));
    const leftCV = this.compareLcs(nodeLeftSlice, otherLeftSlice, 0);

    const nodeRightSlice = node.getSiblings().slice(node.index + 1, node.inde
    x + radius + 1).map(n => this.#hashExtractor.get(n));
    const otherRightSlice = other.getSiblings().slice(other.index + 1, other.
    index + radius + 1).map(n => this.#hashExtractor.get(n));
    const rightCV = this.compareLcs(nodeRightSlice, otherRightSlice, 0);
     */

    // exclude the compared nodes
    const nodePathSlice =
        nodeA
            .path(radius + 1)
            .reverse()
            .slice(1)
            .map((n) => this.#hashExtractor.getContentHash(n));
    const otherPathSlice =
        nodeB
            .path(radius + 1)
            .reverse()
            .slice(1)
            .map((n) => this.#hashExtractor.getContentHash(n));
    const pathCV = this.compareLcs(nodePathSlice, otherPathSlice, 0);
    const posCV = pathCV;
    // TODO weight differently
    return posCV;
  }

  /**
   * Compare the read variables accessed in the nodes.
   * @param {Node} nodeA
   * @param {Node} nodeB
   * @return {?Number} The written variables comparison value form the range
   *     [0;1].
   */
  #compareReadVariables(nodeA, nodeB) {
    const readVarsA = this.#variableExtractor.get(nodeA).readVariables;
    const readVarsB = this.#variableExtractor.get(nodeB).readVariables;
    return this.compareSet(readVarsA, readVarsB);
  }

  /**
   * Compare the content of two Scripts.
   * @param {Node} scriptA
   * @param {Node} scriptB
   * @return {Number} The content comparison value from the range [0;1]
   */
  #compareScriptContent(scriptA, scriptB) {
    const writtenVariablesCV = this.#compareWrittenVariables(scriptA, scriptB);
    const readVariablesCV = this.#compareReadVariables(scriptA, scriptB);

    let contentCV = this.weightedAverage(
        [
          writtenVariablesCV,
          readVariablesCV,
        ],
        [
          Config.COMPARATOR.WRITTEN_VAR_WEIGHT,
          Config.COMPARATOR.READ_VAR_WEIGHT,
        ]);

    if (contentCV != null && scriptA.text !== scriptB.text) {
      // Small penalty for code string inequality
      contentCV += Config.COMPARATOR.EPSILON_PENALTY;
    } else if (scriptA.text != null || scriptB.text != null) {
      // All-or-nothing comparison if code doesn't access any variables
      contentCV = scriptA.text === scriptB.text ? 0 : 1;
    }
    return contentCV;
  }

  /**
   * Perform an comparison between two sets.
   * @param {Set<any>} setA
   * @param {Set<any>} setB
   * @param {?Number} defaultValue The result if the computation is invalid.
   * @return {?Number} The comparison value from the range [0;1]
   */
  compareSet(setA, setB, defaultValue = null) {
    const maxSize = Math.max(setA.size, setB.size);
    if (maxSize === 0) return defaultValue;
    let commonCounter = 0;
    for (const element of setA) {
      if (setB.has(element)) {
        commonCounter++;
      }
    }
    return 1 - (commonCounter / maxSize);
  }

  /**
   * Compare the size of two subtrees.
   * @param {Node} nodeA
   * @param {Node} nodeB
   * @return {Number} The size difference between the two trees.
   */
  compareSize(nodeA, nodeB) {
    return this.#sizeExtractor.get(nodeA) - this.#sizeExtractor.get(nodeB);
  }

  /**
   * Compare two strings.
   * @param {String} strA
   * @param {String} strB
   * @param {?Number} defaultValue The result if the computation is invalid.
   * @return {?Number} The comparison value from the range [0;1]
   */
  compareString(strA, strB, defaultValue = null) {
    if (strA == null || strB == null) return defaultValue;
    // For now, this is an all-or-nothing comparison
    return strA === strB ? 0 : 1;
  }

  /**
   * Compare the read variables accessed in the nodes.
   * @param {Node} nodeA
   * @param {Node} nodeB
   * @return {?Number} The written variables comparison value form the range
   *     [0;1].
   */
  #compareWrittenVariables(nodeA, nodeB) {
    const writtenVarsA = this.#variableExtractor.get(nodeA).writtenVariables;
    const writtenVarsB = this.#variableExtractor.get(nodeB).writtenVariables;
    return this.compareSet(writtenVarsA, writtenVarsB);
  }

  /**
   * Compute the weighted average for a set of comparison values and weights.
   * @param {Array<?Number>} items The array of comparison values from the range
   *     [0;1]. A null value indicates a missing value that won't be considered.
   * @param {Array<Number>} weights The array of weights.
   * @param {?Number} defaultValue The result if the computation is invalid.
   * @return {?Number} The average comparison value from the range [0;1]
   */
  weightedAverage(items, weights, defaultValue = null) {
    let itemSum = 0;
    let weightSum = 0;
    for (let i = 0; i < items.length; i++) {
      if (items[i] != null) {
        // Perfect matches receive a boost for their weight.
        const adjustedWeight =
            (items[i] === 0 ? Config.COMPARATOR.WEIGHT_BOOST_MULITPLIER : 1) *
            weights[i];
        itemSum += items[i] * adjustedWeight;
        weightSum += adjustedWeight;
      }
    }
    if (weightSum === 0) return defaultValue;
    return itemSum / weightSum;
  }
}
