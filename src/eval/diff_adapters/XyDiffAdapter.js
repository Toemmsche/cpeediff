import {EvalConfig} from '../../config/EvalConfig.js';
import xmldom from '@xmldom/xmldom';
import {DiffAdapter} from './DiffAdapter.js';
import {DomHelper} from '../../util/DomHelper.js';
import {Node} from '../../tree/Node.js';

/**
 * Adapter class for the 'XyDiff' algorithm by Cobena et. al.
 *
 * @see https://github.com/fdintino/xydiff
 */
export class XyDiffAdapter extends DiffAdapter {
  /**
   * Construct a new XyDiffAdapter instance.
   */
  constructor() {
    super(EvalConfig.DIFFS.XYDIFF.path, EvalConfig.DIFFS.XYDIFF.displayName);
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

    let cost = 0;

    // Enclosing tag for diff is 'unit_delta'
    let delta = DomHelper.firstChildElement(
        new xmldom.DOMParser().parseFromString(output, 'text/xml'),
        'unit_delta',
    );
    // Edit operations are further enclosed in a 't' tag
    delta = DomHelper.firstChildElement(delta, 't');
    DomHelper.forAllChildElements(delta, (xmlOperation) => {
      // Edit operation type is shortened to a single letter
      switch (xmlOperation.localName) {
        case 'i':
          if (xmlOperation.hasAttribute('move') &&
              xmlOperation.getAttribute('move') === 'yes') {
            moves++;
          } else {
            const xmlElement = DomHelper.firstChildElement(xmlOperation);
            if (xmlElement != null) {
              insertions++;
              // Adjust cost
              cost += Node.fromXmlDom(xmlElement).size();
            } else {
              // Text content insertions are mapped to updates
              updates++;
            }
          }
          break;
        case 'd':
          // Moves are only counted once
          if (!(xmlOperation.hasAttribute('move') &&
              xmlOperation.getAttribute('move') === 'yes')) {
            const xmlElement = DomHelper.firstChildElement(xmlOperation);
            if (xmlElement != null) {
              deletions++;
              // Adjust cost
              cost += Node.fromXmlDom(xmlElement).size();
            } else {
              // Text content deletions are mapped to updates
              updates++;
            }
          }
          break;
        default:
          // XyDiff represents changes on attributes by prefixing the change
          // operation with the letter "a". These operations are mapped to
          // updates in the CpeeDiff change model.
          updates++;
          break;
      }
    });
    // Moves and updates have unit cost
    cost += moves + updates;
    return [
      insertions,
      moves,
      updates,
      deletions,
      cost,
    ];
  }
}


