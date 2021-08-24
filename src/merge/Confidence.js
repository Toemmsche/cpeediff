/**
 * A data class containing information about the confidence of a merge for a
 * certain node.
 * @property {Boolean} contentConfident If the merge is confident about the
 *     content of a node.
 * @property {Boolean} parentConfident If the merge is confident about the
 *     parent node of a node.
 * @property {Boolean} positionConfident If the merge is confident about the
 *     position of a node within the child list of its parent.
 */
export class Confidence {
  /**
   * If the merge is confident about the content of a node.
   * @type {Boolean}
   */
  contentConfident;
  /**
   * If the merge is confident about the parent node of a node.
   * @type {Boolean}
   */
  parentConfident;
  /**
   * If the merge is confident about the position of a node within
   * the child list of its parent.
   * @type {Boolean}
   */
  positionConfident;

  /**
   * Construct a new Confidence instance.
   * @param {Boolean} contentConfident If the merge is confident about the
   *     content of a node.
   * @param {Boolean} parentConfident If the merge is confident about the
   *     parent node of a node.
   * @param {Boolean} positionConfident If the merge is confident about the
   *     position of a node within
   */
  constructor(
      contentConfident = true,
      parentConfident = true,
      positionConfident = true,
  ) {
    this.contentConfident = contentConfident;
    this.parentConfident = parentConfident;
    this.positionConfident = positionConfident;
  }
}


