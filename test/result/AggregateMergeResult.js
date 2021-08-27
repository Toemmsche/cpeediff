import {EvalConfig} from '../EvalConfig.js';

export class AggregateMergeResult {

  algorithm;
  ok;
  acceptable;
  wrongAnswer;
  runtimeError;

  constructor(algorithm, ok, acceptable, wrongAnswer, runtimeError) {
    this.algorithm = algorithm;
    this.ok = ok;
    this.acceptable = acceptable;
    this.wrongAnswer = wrongAnswer;
    this.runtimeError = runtimeError;
  }

  static of(results) {
    const algorithm = results[0].algorithm;
    let ok = 0;
    let acceptable = 0;
    let wrongAnswer = 0;
    let runtimeError = 0;
    for (const result of results) {
      if (result.verdict === AbstractTestResult.VERDICTS.OK) {
        ok++;
      } else if (result.verdict === AbstractTestResult.VERDICTS.ACCEPTABLE) {
        acceptable++;
      } else if (result.verdict === AbstractTestResult.VERDICTS.WRONG_ANSWER) {
        wrongAnswer++;
      } else if (result.verdict === AbstractTestResult.VERDICTS.RUNTIME_ERROR) {
        runtimeError++;
      }
    }

    return new AggregateMergeResult(
        algorithm,
        ok,
        acceptable,
        wrongAnswer,
        runtimeError,
    );
  }
}


