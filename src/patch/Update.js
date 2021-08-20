/**
 * Data class representing an update on a node.
 * Contains information about the old and new value.
 */
export class Update {
  /** @type{String} */
  oldVal;
  /** @type{String} */
  newVal;
  /**
   * The ID of the branch this change belongs to.
   * Null if the update does not occur in a merge context.
   * @type {?Number}
   */
  origin;

  /**
   * Construct a new Update instance.
   * @param {String} oldVal
   * @param {String} newVal
   * @param {?Number} origin
   */
  constructor(oldVal, newVal, origin = null) {
    this.oldVal = oldVal;
    this.newVal = newVal;
    this.origin = origin;
  }

  /** @return {Update} A copy by value of this instance. */
  copy() {
    return Object.assign(new Update('', ''), this);
  }
}