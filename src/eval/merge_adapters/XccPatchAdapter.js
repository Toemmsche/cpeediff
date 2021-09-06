import {EvalConfig} from '../../config/EvalConfig.js';
import {MergeAdapter} from './MergeAdapter.js';

/**
 * Adapter class for the patching algorithm included in 'XML Change Control'
 * algorithm by S. Rönnau and U. M. Borghoff.
 *
 * @see https://launchpad.net/xcc
 */
export class XccPatchAdapter extends MergeAdapter {
  /**
   * Construct a new XccPatchAdapter instance.
   */
  constructor() {
    super(EvalConfig.MERGES.XCC.path, EvalConfig.MERGES.XCC.displayName);
  }
}
