import {EvalConfig} from '../../src/config/EvalConfig.js';
import {MatchPipeline} from '../../src/match/MatchPipeline.js';
import {MatchAdapter} from './MatchAdapter.js';
import {DiffConfig} from '../../src/config/DiffConfig.js';

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
  constructor(matchMode = MatchPipeline.MATCH_MODES.QUALITY) {
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
    DiffConfig.MATCH_MODE = this.#matchMode;
    return MatchPipeline.fromMode().execute(oldTree, newTree);
  }
}


