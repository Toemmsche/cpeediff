import {EvalConfig} from '../EvalConfig.js';
import {MatchPipeline} from '../../src/match/MatchPipeline.js';
import {MatchAdapter} from './MatchAdapter.js';
import {Config} from '../../src/Config.js';

/**
 * An adapter to the CpeeDiff matching algorithm.
 */
export class CpeeMatchAdapter extends MatchAdapter {
  /**
   * The matching mode to use.
   * @type {String}
   * @private
   * @const
   */
  #matchMode;

  /**
   * Construct a new CpeeMatchAdapter instance.
   * @param {String} matchMode The matching mode to use.
   */
  constructor(matchMode) {
    super(
        EvalConfig.MATCHINGS.CPEEMATCH.path,
        EvalConfig.MATCHINGS.CPEEMATCH.displayName + '_' + matchMode,
    );
    this.#matchMode = matchMode;
  }

  /**
   * @inheritDoc
   * @override
   */
  run(oldTree, newTree) {
    Config.MATCH_MODE = this.#matchMode;
    return MatchPipeline.fromMode().execute(oldTree, newTree);
  }
}


