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

export class DiffXmlAdapter extends DiffAdapter {

  constructor() {
    super(TestConfig.DIFFS.DIFFXML.path, TestConfig.DIFFS.DIFFXML.displayName);
  }

  /*
  _parseOutput(output) {
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
                          && parseInt(xmlOperation.getAttribute("nodetype")) === DomHelper.XML_NODE_TYPES.TEXT)) {
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


