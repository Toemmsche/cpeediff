import {Logger} from '../../util/Logger.js';

/**
 * Abstract superclass or all automated evaluations.
 * @abstract
 */
export class AbstractEvaluation {
  /**
   * The adapters of the algorithms to use for the evaluation.
   * @type {Array<DiffAdapter|MatchAdapter|MergeAdapter>}
   * @protected
   * @const
   */
  _adapters;

  /**
   * Construct a new AbstractEvaluation instance.
   * @param {Array<DiffAdapter|MatchAdapter|MergeAdapter>} adapters The
   *     adapters of algorithms the  to use for the evaluation.
   */
  constructor(adapters = []) {
    this._adapters = adapters;
  }

  /**
   * Get the evaluation instance with all adapters.
   * @abstract
   */
  static all() {
    Logger.abstractMethodExecution();
  }

  /**
   * Run the evaluation for all test cases.
   * The results are printed to stdout.
   * @abstract
   */
  evalAll() {
    Logger.abstractMethodExecution();
  }
}
