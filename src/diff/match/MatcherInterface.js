import {Logger} from '../../util/Logger.js';

/**
 * Interface for all matching modules.
 * @interface
 */
export class MatcherInterface {
  /**
   * Extend the matching by executing this matching module.
   * @param {Node} oldTree The root of the old (original) process tree
   * @param {Node} newTree The root of the new (changed) process tree
   * @param {Matching} matching The existing matching to be extended
   * @param {Comparator} comparator The comparator used for comparisons.
   * @abstract
   */
  match(oldTree, newTree, matching, comparator) {
    Logger.abstractMethodExecution();
  }
}
