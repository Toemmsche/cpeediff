/**
 * Data class to hold the semantic properties of a Call node.
 */
export class CallProperties {
  /** @type {String} */
  endpoint;
  /** @type {String} */
  method;
  /** @type {String} */
  label;
  /** @type {Array<String>} */
  args;
  /** @type {String} */
  code;

  /**
   * Create a new CallProperties instance.
   * @param {String} endpoint
   * @param {String} method
   * @param {String} label
   * @param {Array<String>} args
   * @param {String} code
   */
  constructor(endpoint, method, label, args, code) {
    this.endpoint = endpoint;
    this.method = method;
    this.label = label;
    this.args = args;
    this.code = code;
  }

  /** @return {Boolean} If the args property has a non-null value. */
  hasArgs() {
    return this.args != null && this.args.length > 0;
  }

  /** @return {Boolean} If the code property has a non-null value. */
  hasCode() {
    return this.code != null;
  }

  /** @return {Boolean} If the label property has a non-null value. */
  hasLabel() {
    return this.label != null;
  }

  /** @return {Boolean} If the method property has a non-null value. */
  hasMethod() {
    return this.method != null;
  }
}
