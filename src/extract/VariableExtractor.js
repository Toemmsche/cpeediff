import {Dsl} from '../config/Dsl.js';
import {DiffConfig} from '../config/DiffConfig.js';

/**
 * Extractor for retrieving and caching the sets of read and written variables
 * in a node's code.
 * @implements {ExtractorInterface<{writtenVariables: Set<String>,
 *     readVariables: Set<Node>}>}
 */
export class VariableExtractor {
  /**
   * @inheritDoc
   * @type {Map<Node,{writtenVariables: Set<String>,
   *     readVariables: Set<Node>}>}
   * @protected
   */
  _memo;

  /**
   * Extract the sets of read and written variables from a node's content and
   * cache it.
   * @param {Node} node
   * @protected
   */
  _extract(node) {
    this._memo.set(node, {
      writtenVariables: this.#getWrittenVariables(node),
      readVariables: this.#getReadVariables(node),
    });
  }

  /**
   * Get the cached sets of read and written variables.
   * If they are not cached, compute and cache them first.
   * @param {Node} node
   * @return {{writtenVariables: Set<String>,
   *     readVariables: Set<Node>}}
   */
  get(node) {
    if (!this._memo.has(node)) {
      this._extract(node);
    }
    return this._memo.get(node);
  }

  /**
   * An extractor for the properties of <call> nodes.
   * @type {CallPropertyExtractor}
   * @const
   */
  callPropertyExtractor;

  /**
   * Create a new VariableExtractor instance.
   * @param {CallPropertyExtractor} callPropertyExtractor The existing call
   *     property extractor
   */
  constructor(callPropertyExtractor) {
    this._memo = new Map();
    this.callPropertyExtractor = callPropertyExtractor;
  }

  /**
   * Get the set of read variables for a node.
   * @param {Node} node
   * @return {Set<String>}
   * @private
   */
  #getReadVariables(node) {
    let code;
    if (node.isInnerNode()) {
      // May be null, we will check later
      code = node.attributes.get(Dsl.INNER_PROPERTIES.CONDITION.label);
    } else if (node.isScript()) {
      code = node.text;
    } else if (node.isCall()) {
      // Also consider text content of call arguments as code
      const argsCode = this.callPropertyExtractor.get(node).argVals.join(' ');
      code = argsCode + ' ' + this.callPropertyExtractor.get(node).code;
    }
    const readVariables = new Set();
    if (code != null) {
      for (const readVar of this.#readVarsFromString(code)) {
        readVariables.add(readVar);
      }
    }
    return readVariables;
  }

  /**
   * Get the set of written variables for a node.
   * @param {Node} node
   * @return {Set<String>}
   * @private
   */
  #getWrittenVariables(node) {
    let code;
    if (node.isScript()) {
      code = node.text;
    } else if (node.isCall()) {
      code = this.callPropertyExtractor.get(node).code;
    }
    let writtenVariables = new Set();
    if (code != null) {
      writtenVariables = new Set(this.#writtenVarsFromString(code));
    }
    return writtenVariables;
  }

  /**
   * Get an array of read variables contained in a String of code.
   * @param {String} str
   * @return {Array<String>}
   */
  #readVarsFromString(str) {
    // Cannot keep raw dots in variable prefix
    const prefix = DiffConfig.VARIABLE_PREFIX.replaceAll('.', '\\.');
    // Negative lookahead for assignment operators and positive lookbehind for
    // Data element prefix. Also, a positive lookahead for any non-word
    // character is necessary to avoid matching a partial variable descriptor.
    const regex = new RegExp('(?<=' + prefix + ')' +
        '[a-zA-Z$_](\\w|\\$)*(?=($|\\s*[^\\w_$]))(?!\\s*=[^=])', 'g');
    const matches = str.match(regex);
    return matches == null ? [] : matches;
  }

  /**
   * Get an array of written variables contained in a String of code.
   * @param {String} str
   * @return {Array<String>}
   */
  #writtenVarsFromString(str) {
    // Cannot keep raw dots in variable prefix
    const prefix = DiffConfig.VARIABLE_PREFIX.replaceAll('.', '\\.');
    // Positive lookahead for assignment operators and positive lookbehind for
    // data element prefix.
    const regex = new RegExp('(?<=' + prefix + ')' +
        '[a-zA-Z$_](\\w|\\$)*(?=\\s*(=[^=]|\\+=|\\+\\+|-=|--|\\*=|\\/=))', 'g');
    const matches = str.match(regex);
    return matches == null ? [] : matches;
  }
}
