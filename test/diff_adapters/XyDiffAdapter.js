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
import xmldom from 'xmldom';
import {DiffAdapter} from './DiffAdapter.js';
import {DomHelper} from '../../util/DomHelper.js';
import {Node} from '../../src/tree/Node.js';

export class XyDiffAdapter extends DiffAdapter {

  constructor() {
    super(TestConfig.DIFFS.XYDIFF.path, TestConfig.DIFFS.XYDIFF.displayName);
  }

  _parseOutput(output) {
    let updates = 0;
    let insertions = 0;
    let moves = 0;
    let deletions = 0;

    let cost = 0;

    //parse output
    //enclosing tag for diff is "unit_delta"
    let delta = DomHelper.firstChildElement(new xmldom.DOMParser().parseFromString(output, 'text/xml'), 'unit_delta');
    //changes are further enclosed in a "t" tag
    delta = DomHelper.firstChildElement(delta, 't');
    DomHelper.forAllChildElements(delta, (xmlOperation) => {
      //edit operations are shortened to a single letter
      switch (xmlOperation.localName) {
        case 'i':
          //Check if an entire XML element was inserted, or if text content was updated
          if (xmlOperation.hasAttribute('move') && xmlOperation.getAttribute('move') === 'yes') {
            moves++;
          } else {
            const xmlElement = DomHelper.firstChildElement(xmlOperation);
            if (xmlElement != null) {
              insertions++;
              //adjust cost
              cost += Node.fromXmlDom(xmlElement).size();
            } else {
              //text content insertions are mapped to updates
              updates++;
            }
          }
          break;
        case 'd':
          if (xmlOperation.hasAttribute('move') && xmlOperation.getAttribute('move') === 'yes') {
            moves++;
          } else {
            //Check if an entire element was deleted, or if text content was updated
            const xmlElement = DomHelper.firstChildElement(xmlOperation);
            if (xmlElement != null) {
              deletions++;
              //adjust cost
              cost += Node.fromXmlDom(xmlElement).size();
            } else {
              //text content deletions are mapped to updates
              updates++;
            }
          }
          break;
        default:
          /*
          XyDiff represents changes on attributes (which are updates in our change model)
          by prefixing the change operation with the letter "a".
           */
          updates++;
          break;
      }
    });
    //every move is counted twice
    moves /= 2;
    //moves and updates have unit cost
    cost += moves + updates;
    //all moves are detected twice
    return [insertions, moves, updates, deletions, cost];
  }
}


