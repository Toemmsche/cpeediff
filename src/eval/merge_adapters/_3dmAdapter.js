import {EvalConfig} from '../../config/EvalConfig.js';
import {MergeAdapter} from './MergeAdapter.js';

/**
 * Adapter for the 3DM merging algorithm for XML by Tancred Lindholm.
 *
 * @see https://www.cs.hut.fi/~ctl/3dm/
 */
export class _3dmAdapter extends MergeAdapter {
  /**
   * Create a new _3dmAdapter instance.
   */
  constructor() {
    super(EvalConfig.MERGES._3DM.path, EvalConfig.MERGES._3DM.displayName);
  }
}


