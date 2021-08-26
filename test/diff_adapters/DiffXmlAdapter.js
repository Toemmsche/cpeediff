import {EvalConfig} from '../EvalConfig.js';
import {DiffAdapter} from './DiffAdapter.js';

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

  /*
   parseOutput(output) {
   let updates = 0;
   let insertions = 0;
   let moves = 0;
   let deletions = 0;

   //parse output
   const delta = DomHelper.firstChildElement(
   new xmldom.DOMParser().parseFromString(output, "text/xml"), "delta");
   DomHelper.forAllChildElements(delta, (xmlOperation) => {


   switch (xmlOperation.localName) {

   case "move":
   moves++;
   break;
   case "insert":
   //Insertion of text nodes is mapped to updates
   if(xmlOperation.hasAttribute("charpos")
   || (xmlOperation.hasAttribute("nodetype")
   && parseInt(xmlOperation.getAttribute("nodetype")) ===
    DomHelper.XML_NODE_TYPES.TEXT)) {
   updates++;
   } else {
   insertions++;
   }
   //map copies to insertions
   case "copy":
   insertions++;
   break;
   case "remove":
   case "delete":
   deletions++;
   break;
   case "update":
   updates++;
   break;
   }
   })
   const cost = insertions + moves + updates + deletions;
   return [insertions, moves, updates, deletions, cost];
   }
   */

}


