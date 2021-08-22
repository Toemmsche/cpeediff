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
import {MergeAdapter} from './MergeAdapter.js';
import fs from 'fs';
import {execFileSync} from 'child_process';

export class CpeeMergeAdapter extends MergeAdapter {

  constructor() {
    super(TestConfig.MERGES.CPEEMERGE.path, TestConfig.MERGES.CPEEMERGE.displayName);
  }

  _run(base, branch1, branch2) {
    const baseString = XmlFactory.serialize(base);
    const branch1String = XmlFactory.serialize(branch1);
    const branch2String = XmlFactory.serialize(branch2);

    const baseFilePath = 'base.xml';
    const branch1Filepath = '1.xml';
    const branch2FilePath = '2.xml';

    fs.writeFileSync(baseFilePath, baseString);
    fs.writeFileSync(branch1Filepath, branch1String);
    fs.writeFileSync(branch2FilePath, branch2String);

    return execFileSync('./main.js', ['merge', baseFilePath, branch1Filepath, branch2FilePath], TestConfig.EXECUTION_OPTIONS).toString();
  }
}


