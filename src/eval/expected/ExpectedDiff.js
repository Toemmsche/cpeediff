import {AbstractExpected} from './AbstractExpected.js';

/**
 * Expected result for a diff test case.
 */
export class ExpectedDiff extends AbstractExpected {
  /**
   * The proposed edit script.
   * @type {?EditScript}
   * @const
   */
  editScript;

  /**
   * Construct a new ExpectedDiff instance.
   * @param {?EditScript} editScript The proposed edit script.
   */
  constructor(editScript = null) {
    super();
    this.editScript = editScript;
  }

  /**
   * Return an array of values to be inserted in the table containing the diff
   * evaluation results.
   * @return {Array<String>}
   */
  values() {
    return [
      'Expected', // algorithm
      '-', // runtime
      this.editScript?.cost, // cost
      this.editScript?.size(), // edit operations
      this.editScript?.insertions(), // insertions
      this.editScript?.moves(), // moves
      this.editScript?.updates(), // updates
      this.editScript?.deletions(), // deletions
      this.editScript?.toXmlString().length, // diff size
    ];
  }
}
