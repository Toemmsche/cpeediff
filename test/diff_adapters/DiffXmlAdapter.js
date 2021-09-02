import {EvalConfig} from '../../src/config/EvalConfig.js';
import {DiffAdapter} from './DiffAdapter.js';
import {DomHelper} from '../../util/DomHelper.js';
import xmldom from '@xmldom/xmldom';

/**
 * Adapter class for the 'DiffXml' algorithm by A. Mouat.
 *
 * @see http://diffxml.sourceforge.net/
 */
export class DiffXmlAdapter extends DiffAdapter {
  /**
   * Create a new DiffXmlAdapter instance.
   */
  constructor() {
    super(EvalConfig.DIFFS.DIFFXML.path, EvalConfig.DIFFS.DIFFXML.displayName);
  }
}
