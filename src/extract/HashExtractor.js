/*
    Copyright 2021 Tom Papke

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http=//www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
/**
 * @copyright Tom Papke 2021
 * @license
 */

import {AbstractExtractor} from './AbstractExtractor.js';
import {PrimeGenerator} from '../lib/PrimeGenerator.js';
import {stringHash} from '../lib/StringHash.js';

export class HashExtractor extends AbstractExtractor {

  _contentHashMemo;

  constructor() {
    super();
    this._contentHashMemo = new Map();
  }

  _extract(node) {
    this._memo.set(node, this.getContentHash(node) + this._childHash(node));
  }

  getContentHash(node) {
    if (!this._contentHashMemo.has(node)) {
      this._contentHashMemo.set(node, this._contentHash(node));
    }
    return this._contentHashMemo.get(node);
  }

  _contentHash(node) {
    const sortedAttrList = new Array(...node.attributes.keys()).sort();
    let content = node.label;
    for (const key of sortedAttrList) {
      content += key + '=' + node.attributes.get(key);
    }
    if (node.text != null) {
      content += node.text;
    }
    return stringHash(content);
  }

  _childHash(node) {
    let childHash = 0;
    if (node.hasInternalOrdering()) {
      //preserve order by multiplying child hashes with distinct prime number based on index
      const primes = PrimeGenerator.primes(node.degree());
      childHash += node
          .children
          .map((n, i) => this.get(n) * primes[i])
          .reduce((prev, curr) => prev + curr, 0);
    } else {
      //arbitrary order, achieved by simple addition
      childHash += node
          .children
          .map(n => this.get(n))
          .reduce((prev, curr) => prev + curr, 0);
    }
    return childHash;
  }
}