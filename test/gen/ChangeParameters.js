/**
 * Parameters for the random changes applied in the tree generator.
 */
export class ChangeParameters {
  /**
   * Whether to apply changes locally, i.e. within a constrained region of the
   * process tree.
   * @type {Boolean}
   * @const
   */
  local;
  /**
   * The total amount of changes to apply
   * @type {Number}
   * @const
   */
  totalChanges;
  /**
   * The weight of insertions. A higher number will lead to more insertions.
   * @type {Number}
   * @const
   */
  insertionWeight;
  /**
   * The weight of moves. A higher number will lead to more moves.
   * @type {Number}
   * @const
   */
  moveWeight;
  /**
   * The weight of updates. A higher number will lead to more updates.
   * @type {Number}
   * @const
   */
  updateWeight;
  /**
   * The weight of deletions. A higher number will lead to more deletions.
   * @type {Number}
   * @const
   */
  deletionWeight;

  /**
   * Construct a new ChangeParameters instance.
   * @param {Number} totalChanges The total amount of changes to apply
   * @param {Boolean} local Whether to apply changes locally, i.e. within a
   *     constrained region of the process tree.
   * @param {Number} insertionWeight The weight of insertions. A higher number
   *     will lead to more insertions.
   * @param {Number} moveWeight The weight of moves. A higher number will lead
   *     to more moves.
   * @param {Number} updateWeight The weight of updates. A higher number will
   *     lead to more updates.
   * @param {Number} deletionWeight The weight of deletions. A higher number
   *     will lead to more deletions.
   */
  constructor(
      totalChanges = 0,
      local = false,
      insertionWeight = 1,
      moveWeight = 1,
      updateWeight = 1,
      deletionWeight = 1,
  ) {
    this.totalChanges = totalChanges;
    this.local = local;
    this.insertionWeight = insertionWeight;
    this.moveWeight = moveWeight;
    this.updateWeight = updateWeight;
    this.deletionWeight = deletionWeight;
  }

  /**
   * @return {String} A string representation of the change parameters.
   */
  toString() {
    return JSON.stringify(this);
  }
}
