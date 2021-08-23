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
import xmldom from 'xmldom';
import {DomHelper} from '../../util/DomHelper.js';
import {Node} from '../../src/tree/Node.js';

export class DeltaJsAdapter extends DiffAdapter {

  constructor() {
    super(TestConfig.DIFFS.DELTAJS.path, TestConfig.DIFFS.DELTAJS.displayName);
  }

  _parseOutput(output) {
    let updates = 0;
    let insertions = 0;
    let moves = 0;
    let deletions = 0;

    let cost = 0;

    //parse output
    //diff is enclosed in delta
    let delta = DomHelper.firstChildElement(
        new xmldom.DOMParser().parseFromString(output, 'text/xml'), 'delta');

    DomHelper.forAllChildElements(delta, (xmlForest) => {
      //operations are grouped as forests
      DomHelper.forAllChildElements(xmlForest, (xmlOperation) => {
        //Deltajs does not mark moves or updates. Instead, they are provided as insertions.
        //We are so generous and detect updates among their delta
        if (xmlOperation.childNodes.length === 0) return;
        switch (xmlOperation.localName) {
          case 'move':
            moves++;
            break;
          case 'insert':
            const xmlInsertedElement = DomHelper.firstChildElement(xmlOperation);
            if (xmlInsertedElement == null) {
              //Text insertions are mapped to updates
              updates++;
              return;
            } else {
              insertions++;
              DomHelper.forAllChildElements(xmlOperation, (xmlElement) => {
                cost += Node.fromXmlDom(xmlElement).size();
              });
            }
            break;
          case 'remove':
            const xmlDeletedElement = DomHelper.firstChildElement(xmlOperation);
            if (xmlDeletedElement == null) {
              //Text deletions are mapped to updates
              updates++;
              return;
            } else {
              deletions++;
              DomHelper.forAllChildElements(xmlOperation, (xmlElement) => {
                cost += Node.fromXmlDom(xmlElement).size();
              });
            }
            break;
          case 'update':
            updates++;
            break;
          default:
         //   console.log(xmlOperation.localName);
        }
      });
    });
    //every update is counted twice
    updates /= 2;
    //moves and updates have unit cost
    cost += updates + moves;
    return [insertions, moves, updates, deletions, cost];
  }
}


