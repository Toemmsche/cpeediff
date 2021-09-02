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

import {EvalConfig} from '../config/EvalConfig.js';
import {DiffAdapter} from '../../test/diff_adapters/DiffAdapter.js';
import {DomHelper} from '../../util/DomHelper.js';
import xmldom from '@xmldom/xmldom';
import {Node} from '../tree/Node.js';

export class JNDiffAdapter extends DiffAdapter {

  constructor() {
    super(EvalConfig.DIFFS.JNDIFF.path, EvalConfig.DIFFS.JNDIFF.displayName);
  }

  parseOutput(output) {
    let updates = 0;
    let insertions = 0;
    let moves = 0;
    let deletions = 0;

    let cost = 0;
    // parse output
    const delta = DomHelper.firstChildElement(
        new xmldom.DOMParser().parseFromString(output, 'text/xml'), 'NDELTA');
    DomHelper.forAllChildElements(delta, (xmlOperation) => {
      let xmlElement;
      switch (xmlOperation.localName) {
        // no moves...
        case 'EXTRACT':
          deletions++;
          cost++;
          break;
        case 'ADD':
          insertions++;
          cost++;
          break;
        case 'INSERT':
          xmlElement = DomHelper.firstChildElement(xmlOperation);
          if (xmlElement == null) {
            updates++;
          } else {
            insertions++;
            // Determine cost
            cost += Node.fromXmlDom(xmlElement).size();
          }
          break;
        case 'DELETE':
          xmlElement = DomHelper.firstChildElement(xmlOperation);
          if (xmlElement == null) {
            updates++;
          } else {
            deletions++;
            // Determine cost
            cost += Node.fromXmlDom(xmlElement).size();
          }
          break;
        case 'DEL': // Deletion of content
        case 'INS': // Insertion of content
        case 'ATTCHANGE': // Change in attribute content
        case 'ATTDELETE': // Deletion of attribute
        case 'ATTINSERT': // Insertion of attribute
          updates++;
          break;
        default:
          console.log(xmlOperation.localName);
      }
    });
    // Updates and moves have unit cost
    cost += updates + moves;
    return [
      insertions,
      moves,
      updates,
      deletions,
      cost
    ];
  }
}


