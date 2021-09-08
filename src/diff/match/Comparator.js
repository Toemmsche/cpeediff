import {CallPropertyExtractor} from '../../extract/CallPropertyExtractor.js';
import {VariableExtractor} from '../../extract/VariableExtractor.js';
import {SizeExtractor} from '../../extract/SizeExtractor.js';
import {Dsl} from '../../config/Dsl.js';
import {DiffConfig} from '../../config/DiffConfig.js';
import {ElementSizeExtractor} from '../../extract/ElementSizeExtractor.js';
import {getLcsLength, getLcsLengthFast} from '../lib/Lcs.js';
import {HashExtractor} from '../../extract/HashExtractor.js';

/**
 * Wrapper class for the computation of various comparison values.
 */
export class Comparator {
  /**
   * @type {CallPropertyExtractor}
   * @private
   * @const
   */
  #callPropertyExtractor;
  /**
   * @type {VariableExtractor}
   * @private
   * @const
   */
  #variableExtractor;
  /**
   * @type {SizeExtractor}
   * @private
   * @const
   */
  #sizeExtractor;
  /**
   *  @type {ElementSizeExtractor}
   *  @private
   *  @const
   */
  #elementSizeExtractor;
  /**
   * A hash extractor for use by the comparator and matching algorithms.
   * @type {HashExtractor}
   * @const
   */
  hashExtractor;

  /**
   * Create a new Comparator instance.
   */
  constructor() {
    this.#callPropertyExtractor = new CallPropertyExtractor();
    this.#variableExtractor =
        new VariableExtractor(this.#callPropertyExtractor);
    this.#sizeExtractor = new SizeExtractor();
    this.#elementSizeExtractor = new ElementSizeExtractor();
    this.hashExtractor = new HashExtractor();
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
          DiffConfig.COMPARATOR.CONTENT_WEIGHT,
          DiffConfig.COMPARATOR.POSITION_WEIGHT,
        ],
    );
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
        alternativeA.attributes.get(Dsl.INNER_PROPERTIES.CONDITION.label) ??
        Dsl.INNER_PROPERTIES.CONDITION.default;
    const conditionB =
        alternativeB.attributes.get(Dsl.INNER_PROPERTIES.CONDITION.label) ??
        Dsl.INNER_PROPERTIES.CONDITION.default;
    if (readVariablesCV != null && conditionA !== conditionB) {
      // small penalty for code string inequality
      readVariablesCV += DiffConfig.COMPARATOR.EPSILON_PENALTY;
    } else if (conditionA != null || conditionB != null) {
      // All-or-nothing comparison if code doesn't access any variables
      readVariablesCV = conditionA === conditionB ? 0 : 1;
    }
    // readVariablesCV may be null
    // A default value makes sense since a missing condition is usually
    // interpreted as "true"
    const contentCV = this.weightedAverage([readVariablesCV],
        [DiffConfig.COMPARATOR.CONDITION_WEIGHT], 0,
    );

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

    // The endpoint URL has to match exactly
    const endPointCV = propsA.endpoint === propsB.endpoint ? 0 : 1;
    const labelCV = this.compareString(propsA.label, propsB.label);
    const methodCV = this.compareString(propsA.method, propsB.method);
    const argCV = this.compareLcs(propsA.argKeys, propsB.argKeys);

    const serviceCallCV = this.weightedAverage(
        [
          endPointCV,
          labelCV,
          methodCV,
          argCV,
        ],
        [
          DiffConfig.COMPARATOR.CALL_ENDPOINT_WEIGHT,
          DiffConfig.COMPARATOR.CALL_LABEL_WEIGHT,
          DiffConfig.COMPARATOR.CALL_METHOD_WEIGHT,
          DiffConfig.COMPARATOR.CALL_ARGS_WEIGHT,
        ],
    );
    // If the service call has the exact same signature (!), we can rather sure
    // they must match.
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
          DiffConfig.COMPARATOR.WRITTEN_VAR_WEIGHT,
          DiffConfig.COMPARATOR.READ_VAR_WEIGHT,
        ],
    );
    if (codeCV != null && propsA.code !== propsB.code) {
      // Small penalty for code string inequality
      codeCV += DiffConfig.COMPARATOR.EPSILON_PENALTY;
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
          DiffConfig.COMPARATOR.CALL_SERVICE_WEIGHT,
          DiffConfig.COMPARATOR.CALL_CODE_WEIGHT,
        ],
    );
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
        choiceB.attributes.get(Dsl.INNER_PROPERTIES.CHOICE_MODE.label) ??
        Dsl.INNER_PROPERTIES.CHOICE_MODE.default;
    const modeB =
        choiceB.attributes.get(Dsl.INNER_PROPERTIES.CHOICE_MODE.label) ??
        Dsl.INNER_PROPERTIES.CHOICE_MODE.default;

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
      case Dsl.ELEMENTS.SCRIPT.label: {
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
      case Dsl.ELEMENTS.CHOICE.label: {
        return this.#compareChoiceContent(nodeA, nodeB);
      }
        // Label equality is sufficient for stop, break, termination,
        // parallel_branch, critical, otherwise, and root...
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
    if (seqA == null) {
      seqA = [];
    } else if (seqB == null) {
      seqB = [];
    }
    const maxLength = Math.max(seqA.length, seqB.length);
    if (maxLength === 0) return defaultValue;
    return 1 - getLcsLength(seqA, seqB) / maxLength;
  }

  /**
   * Compare the content of two Loops.
   * @param {Node} loopA
   * @param {Node} loopB
   * @return {Number} The content comparison value from the range [0;1]
   */
  #compareLoopContent(loopA, loopB) {
    const modeA =
        loopA.attributes.get(Dsl.INNER_PROPERTIES.LOOP_MODE.label) ??
        Dsl.INNER_PROPERTIES.LOOP_MODE.default;
    const modeB =
        loopB.attributes.get(Dsl.INNER_PROPERTIES.LOOP_MODE.label) ??
        Dsl.INNER_PROPERTIES.LOOP_MODE.default;

    // all or nothing
    const modeCV = modeA === modeB ? 0 : 1;

    let readVariablesCV = this.#compareReadVariables(loopA, loopB);

    const conditionA =
        loopA.attributes.get(Dsl.INNER_PROPERTIES.CONDITION.label) ??
        Dsl.INNER_PROPERTIES.CONDITION.default;
    const conditionB =
        loopB.attributes.get(Dsl.INNER_PROPERTIES.CONDITION.label) ??
        Dsl.INNER_PROPERTIES.CONDITION.default;
    if (readVariablesCV != null && conditionA !== conditionB) {
      // small penalty for code string inequality
      readVariablesCV += DiffConfig.COMPARATOR.EPSILON_PENALTY;
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
          DiffConfig.COMPARATOR.MODE_WEIGHT,
          DiffConfig.COMPARATOR.CONDITION_WEIGHT,
        ], 0,
    );

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
        parallelA.attributes.get(Dsl.INNER_PROPERTIES.PARALLEL_WAIT.label) ??
        Dsl.INNER_PROPERTIES.PARALLEL_WAIT.default;
    const waitB =
        parallelB.attributes.get(Dsl.INNER_PROPERTIES.PARALLEL_WAIT.label) ??
        Dsl.INNER_PROPERTIES.PARALLEL_WAIT.default;

    const cancelA =
        parallelA.attributes
            .get(Dsl.INNER_PROPERTIES.PARALLEL_CANCEL.label) ??
        Dsl.INNER_PROPERTIES.PARALLEL_CANCEL.default;
    const cancelB =
        parallelB.attributes
            .get(Dsl.INNER_PROPERTIES.PARALLEL_CANCEL.label) ??
        Dsl.INNER_PROPERTIES.PARALLEL_CANCEL.default;

    // all or nothing
    const modeCV = waitA === waitB && cancelA === cancelB ? 0 : 1;

    const contentCV = modeCV;

    return contentCV;
  }

  /**
   * Because the path compare range is constant, the corresponding LCS
   * computation can be accelerated.
   * @param {Array<Number>} pathA
   * @param {Array<Number>} pathB
   * @return {?Number} The comparison value from the range [0;1]
   */
  #comparePathLcs(pathA, pathB) {
    const maxLength = Math.max(pathA.length, pathB.length);
    if (maxLength === 0) return 0;
    return 1 - getLcsLengthFast(pathA, pathB) / maxLength;
  }

  /**
   * Compare the position of two nodes, determined by their paths.
   * @param {Node} nodeA
   * @param {Node} nodeB
   * @return {Number} The positional comparison value from the range [0;1]
   */
  comparePosition(nodeA, nodeB) {
    const radius = DiffConfig.COMPARATOR.PATH_COMPARE_RANGE;

    /*
     const nodeLeftSlice = nodeA.getSiblings()
     .slice(Math.max(nodeA.index - radius, 0), nodeA.index)
     .map(n => this.hashExtractor.get(n));
     const otherLeftSlice = nodeB.getSiblings()
     .slice(Math.max(nodeB.index - radius, 0), nodeB.index)
     .map(n => this.hashExtractor.get(n));
     const leftCV = this.compareLcs(nodeLeftSlice, otherLeftSlice, 0);

     const nodeRightSlice = nodeA.getSiblings()
     .slice(nodeA.index + 1, nodeA.index + radius + 1)
     .map(n => this.hashExtractor.get(n));
     const otherRightSlice = nodeB.getSiblings()
     .slice(nodeB.index + 1, nodeB.index + radius + 1)
     .map(n => this.hashExtractor.get(n));
     const rightCV = this.compareLcs(nodeRightSlice, otherRightSlice, 0);

     */

    // exclude the compared nodes
    const nodePathSlice =
        nodeA
            .path(radius + 1)
            .reverse()
            .slice(1)
            .map((n) => this.hashExtractor.getContentHash(n));
    const otherPathSlice =
        nodeB
            .path(radius + 1)
            .reverse()
            .slice(1)
            .map((n) => this.hashExtractor.getContentHash(n));
    const pathCV = this.#comparePathLcs(nodePathSlice, otherPathSlice);
    return pathCV;
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
          DiffConfig.COMPARATOR.WRITTEN_VAR_WEIGHT,
          DiffConfig.COMPARATOR.READ_VAR_WEIGHT,
        ],
    );

    if (contentCV != null && scriptA.text !== scriptB.text) {
      // Small penalty for code string inequality
      contentCV += DiffConfig.COMPARATOR.EPSILON_PENALTY;
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
    const size = Math.max(setA.size, setB.size);
    if (size === 0) return defaultValue;
    let commonCounter = 0;
    for (const element of setA) {
      if (setB.has(element)) {
        commonCounter++;
      }
    }
    return 1 - (commonCounter / size);
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
    if (strA == null && strB == null) return defaultValue;
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
   * @param {Array<?Number>} items The array of comparison values from the
   *     range
   *     [0,1]. A null value indicates a missing value that won't be
   *     considered.
   * @param {Array<Number>} weights The array of weights.
   * @param {?Number} defaultValue The result if the computation is invalid.
   * @return {?Number} The weighted average from the range [0,1] of the
   *     supplied comparison values.
   */
  weightedAverage(items, weights, defaultValue = null) {
    let itemSum = 0;
    let weightSum = 0;
    for (let i = 0; i < items.length; i++) {
      if (items[i] != null) {
        // Perfect matches receive a boost for their weight.
        const adjustedWeight =
            (items[i] === 0 ? DiffConfig.COMPARATOR.WEIGHT_BOOST_MULTIPLIER :
             1) *
            weights[i];
        itemSum += items[i] * adjustedWeight;
        weightSum += adjustedWeight;
      }
    }
    if (weightSum === 0) return defaultValue;
    return itemSum / weightSum;
  }
}
