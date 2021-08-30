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

import {EvalConfig} from '../config/EvalConfig.js';
import {DiffAdapter} from '../../test/diff_adapters/DiffAdapter.js';
import vkbeautify from 'vkbeautify';
import fs from 'fs';
import {execFileSync} from 'child_process';

export class UnixDiffAdapter extends DiffAdapter {

  constructor() {
    super(EvalConfig.DIFFS.UNIXDIFF.path, EvalConfig.DIFFS.UNIXDIFF.displayName);
  }

  run(oldTree, newTree) {
    const oldTreeString = oldTree.toXmlString();
    const newTreeString = newTree.toXmlString();

    const oldFilePath = this.path + '/' + EvalConfig.FILENAMES.OLD_TREE;
    const newFilePath = this.path + '/' + EvalConfig.FILENAMES.NEW_TREE;

    //always beautify XML for unix diff, otherwise the entire XML document is contained in a single line...
    fs.writeFileSync(oldFilePath, vkbeautify.xml(oldTreeString));
    fs.writeFileSync(newFilePath, vkbeautify.xml(oldTreeString));

    let time = new Date().getTime();
    return {
      output: execFileSync(this.path + '/' + EvalConfig.FILENAMES.RUN_SCRIPT, [oldFilePath, newFilePath], EvalConfig.EXECUTION_OPTIONS).toString(),
      runtime: new Date().getTime() - time
    };
  }

  parseOutput(output) {
    let insertions = 0;
    let deletions = 0;

    //always beautify output
    for (const line of output.split('\n')) {
      if (line.startsWith('<')) {
        deletions++;
      } else if (line.startsWith('>')) {
        insertions++;
      }
    }
    //unix diff cannot detect moves or updates
    return [insertions, 0, 0, deletions, insertions + deletions];
  }
}


