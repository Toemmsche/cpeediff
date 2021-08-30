import {DiffConfig} from '../../src/config/DiffConfig.js';
import {Dsl} from '../../src/config/Dsl.js';
import {DiffAdapter} from './DiffAdapter.js';
import {EvalConfig} from '../../src/config/EvalConfig.js';
import fs from 'fs';
import {execFileSync} from 'child_process';
import {EditScript} from '../../src/delta/EditScript.js';
import {MatchPipeline} from '../../src/match/MatchPipeline.js';

/**
 * Diff adapter for CpeeDiff.
 */
export class CpeeDiffAdapter extends DiffAdapter {
  /**
   * The matching mode to use.
   * @type {String}
   * @private
   * @const
   */
  #mode;

  /**
   * Construct a new CpeeDiffAdapter instance.
   * @param {String} mode The matching mode to use. "quality" by default.
   */
  constructor(mode = MatchPipeline.MATCH_MODES.QUALITY) {
    super(
        EvalConfig.DIFFS.CPEEDIFF.path,
        EvalConfig.DIFFS.CPEEDIFF.displayName + '_' + mode,
    );
    this.#mode = mode;
  }

  /**
   * @inheritDoc
   * @override
   */
  parseOutput(output) {
    let updates = 0;
    let insertions = 0;
    let moves = 0;
    let deletions = 0;

    const delta = EditScript.fromXmlString(output);
    for (const change of delta) {
      switch (change.type) {
        case Dsl.CHANGE_MODEL.INSERTION.label:
          insertions++;
          break;
        case Dsl.CHANGE_MODEL.DELETION.label:
          deletions++;
          break;
        case Dsl.CHANGE_MODEL.MOVE.label:
          moves++;
          break;
        case Dsl.CHANGE_MODEL.UPDATE.label:
          updates++;
          break;
      }
    }
    return [
      insertions,
      moves,
      updates,
      deletions,
      delta.cost,
    ];
  }

  /**
   * @inheritDoc
   * @override
   */
  run(oldTree, newTree) {
    const oldTreeString = oldTree.toXmlString();
    const newTreeString = newTree.toXmlString();

    const oldFilePath = EvalConfig.FILENAMES.OLD_TREE;
    const newFilePath = EvalConfig.FILENAMES.NEW_TREE;

    fs.writeFileSync(oldFilePath, oldTreeString);
    fs.writeFileSync(newFilePath, newTreeString);

    const time = new Date().getTime();
    return {
      output: execFileSync(
          './main.js',
          [
            'diff',
            '--mode',
            this.#mode,
            oldFilePath,
            newFilePath,
          ],
          EvalConfig.EXECUTION_OPTIONS,
      ).toString(),
      runtime: new Date().getTime() - time,
    };
  }
}


