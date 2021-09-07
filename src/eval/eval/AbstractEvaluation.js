import {Logger} from '../../util/Logger.js';

/**
 * Abstract superclass or all automated evaluations.
 * @abstract
 */
export class AbstractEvaluation {
  /**
   * Constants needed for automated output of Latex plots.
   * @type {Object}
   */
  static LATEX = {
    COLORS: 'black, red, blue, magenta, orange, violet, teal'.split(
        ', '),
    MARKERS: 'square*, triangle*, *, diamond*, square, triangle, o, diamond'.split(
        ', '),
    LINE_TYPES: 'solid, densely dashdotted, densely dotted, dashdotted, solid, densely dashed, densely dashdotdotted'.split(
        ', '),
    fromTemplate: (coordinates) => {
      return coordinates.map((list, i) =>
          '\\addplot[\n' +
          '    thick,\n' +
          '    ' + AbstractEvaluation.LATEX.LINE_TYPES[i] + ',\n' +
          '    color=' + AbstractEvaluation.LATEX.COLORS[i] + ',\n' +
          '    mark=' + AbstractEvaluation.LATEX.MARKERS[i] + ',\n' +
          '    mark options = {solid},\n' +
          '    ]\n' +
          '    coordinates {\n' +
          '    ' + coordinates[i].join('') + '\n' +
          '    };').join('\n');
    },
  };
  /**
   * The adapters of the algorithms to use for the evaluation.
   * @type {Array<DiffAdapter|MatchAdapter|MergeAdapter>}
   * @protected
   * @const
   */
  _adapters;

  /**
   * Construct a new AbstractEvaluation instance.
   * @param {Array<DiffAdapter|MatchAdapter|MergeAdapter>} adapters The
   *     adapters of algorithms the  to use for the evaluation.
   */
  constructor(adapters = []) {
    this._adapters = adapters;
  }

  /**
   * Get the evaluation instance with all adapters.
   * @abstract
   */
  static all() {
    Logger.abstractMethodExecution();
  }

  /**
   * Run the evaluation for all test cases.
   * The results are printed to stdout.
   * @abstract
   */
  evalAll() {
    Logger.abstractMethodExecution();
  }
}
