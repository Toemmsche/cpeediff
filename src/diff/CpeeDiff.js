import {EditScriptGenerator} from './delta/EditScriptGenerator.js';
import {MatchPipeline} from './match/MatchPipeline.js';
import {Node} from '../tree/Node.js';
import {Logger} from '../util/Logger.js';

/**
 * A coordinator class for the CPEE process tree difference algorithm.
 */
export class CpeeDiff {
  /**
   * The match pipeline to use for the diff.
   * @type {MatchPipeline}
   * @private
   * @const
   */
  #matchPipeline;
  /**
   * The edit script generator to use for the diff.
   * @type {EditScriptGenerator}
   * @private
   * @const
   */
  #editScriptGenerator;

  /**
   * Create a new CpeeDiff instance with the specified match pipeline.
   * By default, the pipeline is configured based on the selected matching
   * mode.
   * @param {MatchPipeline} matchPipeline
   */
  constructor(matchPipeline = MatchPipeline.fromMode()) {
    this.#matchPipeline = matchPipeline;
    this.#editScriptGenerator = new EditScriptGenerator();
  }

  /**
   * Run the diff algorithm from a top-level perspective
   * @param {Node} oldTree The root of the original process tree
   * @param {Node} newTree The root of the changed process tree
   * @return {EditScript}
   */
  diff(oldTree, newTree) {
    Logger.section('CpeeDiff', this);
    // Edit script generation modifies the old tree, hence a copy is used
    const oldTreeCopy = Node.fromNode(oldTree);
    const matching = this.#matchPipeline.execute(oldTreeCopy, newTree);
    return this
        .#editScriptGenerator
        .generateEditScript(oldTreeCopy, newTree, matching);
  }
}
