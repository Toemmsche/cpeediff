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

import {EvalConfig} from '../EvalConfig.js';

export class AggregateMatchResult {

  algorithm;
  ok;
  wrongAnswer;
  runtimeError;

  constructor(algorithm, ok, wrongAnswer, runtimeError) {
    this.algorithm = algorithm;
    this.ok = ok;
    this.wrongAnswer = wrongAnswer;
    this.runtimeError = runtimeError;
  }

  static of(results) {
    let ok = 0;
    let wrongAnswer = 0;
    let runtimeError = 0;
    for (const result of results) {
      if (result.verdict === EvalConfig.VERDICTS.OK) {
        ok++;
      } else if (result.verdict === EvalConfig.VERDICTS.WRONG_ANSWER) {
        wrongAnswer++;
      } else if (result.verdict === EvalConfig.VERDICTS.RUNTIME_ERROR) {
        runtimeError++;
      }
    }
    return new AggregateMatchResult(results[0].algorithm, ok, wrongAnswer, runtimeError);
  }

  static header() {
    return ['Algorithm', '#OK', '#Wrong Answer', '#Runtime Error'];
  }

  values() {
    return [this.algorithm, this.ok, this.wrongAnswer, this.runtimeError];
  }
}


