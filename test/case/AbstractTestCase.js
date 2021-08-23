/**
 * Abstract superclass for all test cases.
 */
export class AbstractTestCase {
  /**
   * The name of the this test case.
   * @type {String}
   * @const
   */
  name;
  /**
   * The expected result.
   * @type {AbstractExpected}
   * @const
   */
  expected;

  /**
   * Create a new AbstractTestCase instance.
   * @param {String} name The name of this test case
   * @param {AbstractExpected} expected The expected result for this test case
   */
  constructor(name, expected) {
    this.name = name;
    this.expected = expected;
  }
}
