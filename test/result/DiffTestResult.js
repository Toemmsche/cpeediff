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

import {AbstractTestResult} from './AbstractTestResult.js';

export class DiffTestResult extends AbstractTestResult {

  runtime;

  constructor(caseName, algorithm, runtime, actual, verdict) {
    super(caseName, algorithm, actual, verdict);
    this.runtime = runtime;
  }

  /**
   * @return any[] An array of all values that should appear in the evaluation table.
   */
  values() {
    //A non-OK verdict indicates failure, fill array with it
    if (!this.isOk()) {
      return [this.algorithm, ...(new Array(8).fill(this.verdict))];
    }
    return [this.algorithm, this.runtime, this.actual.cost, this.actual.diffSize, this.actual.editOperations,
      this.actual.insertions, this.actual.moves, this.actual.updates, this.actual.deletions];
  }

  /**
   * @return String[] An array containing the descriptors of all values that should appear in the evaluation table.
   */
  static header() {
    return ['Algorithm', 'Runtime', 'Cost', 'Diff Size', 'Edit Operations', 'Insertions', 'Moves', 'Updates', 'Deletions'];
  }
}


