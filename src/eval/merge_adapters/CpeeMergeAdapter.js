import {EvalConfig} from '../../config/EvalConfig.js';
import {MergeAdapter} from './MergeAdapter.js';
import fs from 'fs';
import {execFileSync} from 'child_process';

/**
 * Adapter to the CpeeMerge algorithm.
 *
 * @see {CpeeMerge}
 */
export class CpeeMergeAdapter extends MergeAdapter {
  /**
   * Create a new CpeeMergeAdapter instance.
   */
  constructor() {
    super(
        EvalConfig.MERGES.CPEEMERGE.path,
        EvalConfig.MERGES.CPEEMERGE.displayName,
    );
  }

  /**
   * @inheritDoc
   * @override
   */
  run(base, branch1, branch2) {
    const baseString = base.toXmlString();
    const branch1String = branch1.toXmlString();
    const branch2String = branch2.toXmlString();

    const baseFilePath = 'base.xml';
    const branch1Filepath = '1.xml';
    const branch2FilePath = '2.xml';

    fs.writeFileSync(baseFilePath, baseString);
    fs.writeFileSync(branch1Filepath, branch1String);
    fs.writeFileSync(branch2FilePath, branch2String);

    return execFileSync(
        this.path,
        [
          'merge',
          baseFilePath,
          branch1Filepath,
          branch2FilePath,
        ],
        EvalConfig.EXECUTION_OPTIONS,
    ).toString();
  }
}
