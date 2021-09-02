import {EvalConfig} from '../../src/config/EvalConfig.js';
import {DiffAdapter} from './DiffAdapter.js';
import {DomHelper} from '../../util/DomHelper.js';
import xmldom from '@xmldom/xmldom';
import {Node} from '../../src/tree/Node.js';

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
            insertions++;
            // Determine cost
            const xmlNewValue = DomHelper.firstChildElement(
                xmlOperation,
                'newvalue',
            );
            DomHelper.forAllChildElements(xmlNewValue, (xmlElement) => {
              cost += Node.fromXmlDom(xmlElement).size();
            });
          }
          break;
        case 'delete':
          // Moves are account for in the insertion case
          if (!xmlOperation.hasAttribute('id')) {
            deletions++;
            // Determine cost
            const xmlNewValue = DomHelper.firstChildElement(
                xmlOperation,
                'oldvalue',
            );
            DomHelper.forAllChildElements(xmlNewValue, (xmlElement) => {
              cost += Node.fromXmlDom(xmlElement).size();
            });
          }
          break;
        case 'update':
          updates++;
          break;
        default: {
          console.log("other");
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


