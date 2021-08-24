/**
 * Data class to hold the semantic properties of a Call node.
 */
export class CallProperties {
  /**
   * A URI that uniquely identifies the call's handler.
   * @type {String}
   * @const
   */
  endpoint;
  /**
   * The HTTP method used for the call.
   * @type {String}
   * @const
   */
  method;
  /**
   * A short description of the call's purpose.
   * @type {String}
   * @const
   */
  label;
  /**
   * The arguments of the call.
   * @type {Array<String>}
   * @const
   */
  args;
  /**
   * A concatenation of all code snippets contained in the call.
   * @type {String}
   * @const
   */
  code;

  /**
   * Create a new CallProperties instance.
   * @param {String} endpoint A URI that uniquely identifies the call's
   *     handler.
   * @param {String} method The HTTP method used for the call.
   * @param {String} label The arguments of the call
   * @param {Array<String>} args The arguments of the call
   * @param {String} code A concatenation of all code snippets contained in the
   *     call.
   */
  constructor(
      endpoint,
      method,
      label,
      args,
      code,
  ) {
    this.endpoint = endpoint;
    this.method = method;
    this.label = label;
    this.args = args;
    this.code = code;
  }

  /** @return {Boolean} */
  hasArgs() {
    return this.args != null && this.args.length > 0;
  }

  /** @return {Boolean} */
  hasCode() {
    return this.code != null;
  }

  /** @return {Boolean} */
  hasLabel() {
    return this.label != null;
  }

  /** @return {Boolean} */
  hasMethod() {
    return this.method != null;
  }
}
