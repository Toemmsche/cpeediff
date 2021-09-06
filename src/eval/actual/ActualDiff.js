import {AbstractActual} from './AbstractActual.js';

/**
 * Data class for the actual output of a diff algorithm.
 */
export class ActualDiff extends AbstractActual {
  /**
   * The total number of detected edit operations.
   * @type {Number}
   * @const
   */
  editOperations;
  /**
   * The total number of detected insertions.
   * @type {Number}
   * @const
   */
  insertions;
  /**
   * The total number of detected moves.
   * @type {Number}
   * @const
   */
  moves;
  /**
   * The total number of detected updates.
   * @type {Number}
   * @const
   */
  updates;
  /**
   * The total number of detected deletions.
   * @type {Number}
   * @const
   */
  deletions;
  /**
   * The overall cost of the edit script.
   * @type {Number}
   * @const
   */
  cost;
  /**
   * The size of the diff in Bytes.
   * @type {Number}
   * @const
   */
  diffSize;

  /**
   * Construct a new ActualDiff instance.
   * @param {String} raw The raw diff output.
   * @param {Number} insertions The number of detected insertions.
   * @param {Number} moves The number of detected moves.
   * @param {Number} updates The number of detected updates.
   * @param {Number} deletions The number of detected deletions.
   * @param {Number} cost The overall cost of the edit script.
   */
  constructor(
      raw,
      insertions,
      moves,
      updates,
      deletions,
      cost = 0,
  ) {
    super(raw);
    // Total number of edit operations can be inferred
    this.editOperations = insertions + moves + updates + deletions;
    this.insertions = insertions;
    this.moves = moves;
    this.updates = updates;
    this.deletions = deletions;
    // Diff size can be inferred
    this.diffSize = raw.length;
    this.cost = cost;
  }
}


