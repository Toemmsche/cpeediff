import {EvalConfig} from '../../config/EvalConfig.js';
import {DiffAdapter} from './DiffAdapter.js';
import {DomHelper} from '../../util/DomHelper.js';
import xmldom from '@xmldom/xmldom';
import {Node} from '../../tree/Node.js';

/**
 * Adapter class for the 'XML Change Control' algorithm by S. Rönnau and U. M.
 * Borghoff.
 *
 * @see https://launchpad.net/xcc
 */
export class XccAdapter extends DiffAdapter {

  /**
   * Construct a new XccAdapter instance
   */
  constructor() {
    super(EvalConfig.DIFFS.XCC.path, EvalConfig.DIFFS.XCC.displayName);
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

    // Enclosing tag is 'delta'
    const delta = DomHelper.firstChildElement(
        new xmldom.DOMParser().parseFromString(output, 'text/xml'),
        'delta',
    );
    DomHelper.forAllChildElements(delta, (xmlOperation) => {
      switch (xmlOperation.localName) {
        case 'insert':
          // Moves are insertions and deletions that are linked by an 'id'
          // attribute
          if (xmlOperation.hasAttribute('id')) {
            moves++;
          } else {
            // Determine cost
            const xmlNewValue = DomHelper.firstChildElement(
                xmlOperation,
                'newvalue',
            );
            if (DomHelper.firstChildElement(xmlNewValue) == null) {
              updates++;
            } else {
              insertions++;
              DomHelper.forAllChildElements(xmlNewValue, (xmlElement) => {
                cost += Node.fromXmlDom(xmlElement).size();
              });
            }
          }
          break;
        case 'delete':
          // Moves are accounted for in the insertion case
          if (!xmlOperation.hasAttribute('id')) {
            // Determine cost
            const xmlOldValue = DomHelper.firstChildElement(
                xmlOperation,
                'oldvalue',
            );
            if (DomHelper.firstChildElement(xmlOldValue) == null) {
              updates++;
            } else {
              deletions++;
              DomHelper.forAllChildElements(xmlOldValue, (xmlElement) => {
                cost += Node.fromXmlDom(xmlElement).size();
              });
            }
          }
          break;
        case 'update':
          updates++;
          break;
        default: {
          console.log('other');
        }
      }
    });
    // Unit cost
    cost += updates + moves;
    return [
      insertions,
      moves,
      updates,
      deletions,
      cost,
    ];
  }
}


