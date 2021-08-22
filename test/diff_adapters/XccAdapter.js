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

import {TestConfig} from '../TestConfig.js';
import {DiffAdapter} from './DiffAdapter.js';
import {DomHelper} from '../../util/DomHelper.js';
import xmldom from 'xmldom';
import {Node} from '../../src/tree/Node.js';

export class XccAdapter extends DiffAdapter {

  constructor() {
    super(TestConfig.DIFFS.XCC.path, TestConfig.DIFFS.XCC.displayName);
  }

  _parseOutput(output) {
    let updates = 0;
    let insertions = 0;
    let moves = 0;
    let deletions = 0;

    let cost = 0;
    //parse output
    const delta = DomHelper.firstChildElement(
        new xmldom.DOMParser().parseFromString(output, 'text/xml'), 'delta');
    DomHelper.forAllChildElements(delta, (xmlOperation) => {
      switch (xmlOperation.localName) {
        case 'insert':
          //moves are insertions and deletions with the same "id" attribute
          if (xmlOperation.hasAttribute('id')) {
            moves++;
          } else {
            insertions++;
            //determine cost
            const xmlNewValue = DomHelper.firstChildElement(xmlOperation, 'newvalue');
            DomHelper.forAllChildElements(xmlNewValue, (xmlElement) => {
              cost += Node.fromXmlDom(xmlElement).size();
            });
          }
          break;
        case 'delete':
          //moves are insertions and deletions with the same "id" attribute
          if (xmlOperation.hasAttribute('id')) {
            moves++;
          } else {
            deletions++;
            //determine cost
            const xmlNewValue = DomHelper.firstChildElement(xmlOperation, 'oldvalue');
            DomHelper.forAllChildElements(xmlNewValue, (xmlElement) => {
              cost += Node.fromXmlDom(xmlElement).size();
            });
          }
          break;
        case 'update':
          updates++;
          break;
      }
    });
    moves /= 2;
    //updates and moves have unit cost
    cost += updates + moves;
    //every move is counted twice
    return [insertions, moves, updates, deletions, cost];
  }
}


