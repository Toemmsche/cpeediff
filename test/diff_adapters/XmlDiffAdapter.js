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

import {TestConfig} from '../TestConfig.js';
import {DiffAdapter} from './DiffAdapter.js';

export class XmlDiffAdapter extends DiffAdapter {

  constructor() {
    super(TestConfig.DIFFS.XMLDIFF.path, TestConfig.DIFFS.XMLDIFF.displayName);
  }

  _parseOutput(output) {
    let updates = 0;
    let insertions = 0;
    let moves = 0;
    let deletions = 0;

    //parse output
    for (const line of output.split('\n')) {
      if (line !== '') {
        if (!line.startsWith('[')) {
          throw new Error('unknown output');
        }

        //xmldiff output pattern: [{type}, {path} {description of the change}]
        const type = line.split(',')[0].slice(1);
        switch (type) {
          case 'delete':
            deletions++;
            break;
          case 'insert':
            insertions++;
            break;
          case 'move':
            moves++;
            break;
          default:
            //There are many operations that are best mapped to an update like "insert-attribute"
            //or "rename"
            updates++;
            break;
        }
      }
    }
    //Every operation has unit cost
    const cost = insertions + moves + updates + deletions;
    return [insertions, moves, updates, deletions, cost];
  }
}


