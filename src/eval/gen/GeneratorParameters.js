/**
 * Parameters for the random process tree generator.
 */
export class GeneratorParameters {

  /**
   * The desired size of the process tree.
   * @type {Number}
   */
  size;
  /**
   * The maximum depth of the process tree
   * @type {Number}
   * @const
   */
  maxDepth;
  /**
   * The maximum width of the process tree. Effectively limits the number of
   * children a node can have.
   * @type {Number}
   * @const
   */
  maxDegree;
  /**
   * The maximum amount of read and written vars that appear in code snippets.
   * Also limits the number of call arguments.
   * @type {Number}
   * @const
   */
  maxVars;

  /**
   * @param {Number} size The desired size of the process tree.
   * @param {Number} maxDepth The maximum depth of the process tree
   * @param {Number} maxDegree The maximum width of the process tree.
   *     Effectively limits the number of children a node can have.
   * @param {Number} maxVars The maximum amount of read and written vars that
   *     appear in code snippets. Also limits the number of call arguments.
   */
  constructor(
      size,
      maxDepth,
      maxDegree,
      maxVars,
  ) {
    this.size = size;
    this.maxDepth = maxDepth;
    this.maxDegree = maxDegree;
    this.maxVars = maxVars;
  }

  /**
   * @return {String} A string representation of the generator parameters.
   */
  toString() {
    return JSON.stringify(this);
  }
}