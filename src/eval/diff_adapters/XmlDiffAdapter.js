import {EvalConfig} from '../../config/EvalConfig.js';
import {DiffAdapter} from './DiffAdapter.js';

/**
 * Adapter class for the 'xmldiff' algorithm.
 *
 * @see https://pypi.org/project/xmldiff/
 */
export class XmlDiffAdapter extends DiffAdapter {
  /**
   * Construct a new XmlDiffAdapter instance.
   */
  constructor() {
    super(EvalConfig.DIFFS.XMLDIFF.path, EvalConfig.DIFFS.XMLDIFF.displayName);
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

    for (const line of output.split('\n')) {
      if (line !== '') {
        if (line.startsWith('[')) {
          // xmldiff output pattern: [{type}, {path} {description of the
          // change}]
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
              // There are many operations that are best mapped to an update
              // like "insert-attribute" or "rename"
              updates++;
              break;
          }
        }
      }
    }
    // Every operation has unit cost
    const cost = insertions + moves + updates + deletions;
    return [
      insertions,
      moves,
      updates,
      deletions,
      cost,
    ];
  }
}


