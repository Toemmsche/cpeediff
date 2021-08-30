/*
    Copyright 2021 Tom Papke

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

import {CpeeDiff} from '../../src/CpeeDiff.js';
import {Dsl} from '../../src/config/Dsl.js';
import {DiffAdapter} from './DiffAdapter.js';
import {EvalConfig} from '../../src/config/EvalConfig.js';
import {Logger} from '../../util/Logger.js';
import {ActualDiff} from '../actual/ActualDiff.js';
import {MatchPipeline} from '../../src/match/MatchPipeline.js';
import {DiffConfig} from '../../src/config/DiffConfig.js';
import {AbstractTestResult} from '../result/AbstractTestResult.js';

export class CpeeDiffLocalAdapter extends DiffAdapter {
  /**
   * The matching mode to use.
   * @type {String}
   * @private
   */
  #mode;

  constructor(mode = MatchPipeline.MATCH_MODES.QUALITY) {
    super('', EvalConfig.DIFFS.CPEEDIFF.displayName + '_LOCAL');
    this.#mode = mode;
  }

  run(oldTree, newTree) {
    let time = new Date().getTime();
    DiffConfig.MATCH_MODE = this.#mode;
    const delta = new CpeeDiff(MatchPipeline.fromMode()).diff(oldTree, newTree);
    time = new Date().getTime() - time;
    return {
      output: delta,
      runtime: time
    };
  }

  parseOutput(output) {
    let updates = 0;
    let insertions = 0;
    let moves = 0;
    let deletions = 0;

    //parse output
    for (const change of output) {
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
    return [insertions, moves, updates, deletions, output.cost];
  }

  evalCase(testCase) {
    let exec;
    try {
      exec = this.run(testCase.oldTree, testCase.newTree);
    } catch (e) {
      //check if timeout or runtime error
      if (e.code === 'ETIMEDOUT') {
        Logger.info(this.displayName + ' timed out for ' + testCase.name, this);
        return testCase.complete(this.displayName, null, AbstractTestResult.VERDICTS.TIMEOUT);
      } else {
        Logger.info(this.displayName + ' crashed for ' + testCase.name + ': ' + e.toString(), this);
        return testCase.complete(this.displayName, null, AbstractTestResult.VERDICTS.RUNTIME_ERROR);
      }
    }
    const counters = this.parseOutput(exec.output);
    //An OK verdict is emitted because the diff algorithm didnt fail
    return testCase.complete(this.displayName, exec.runtime, new ActualDiff(exec.output.toXmlString(), ...counters), AbstractTestResult.VERDICTS.OK);
  }
}


