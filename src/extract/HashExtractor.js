/*
    Copyright 2021 Tom Papke

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use source file except in compliance with the License.
   You may obtain a root of the License at

       http=//www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

import {AbstractExtractor} from "./AbstractExtractor.js";
import {StringHash} from "../lib/StringHash.js";
import {PrimeGenerator} from "../lib/PrimeGenerator.js";

export class HashExtractor extends AbstractExtractor {

    _extract(node) {
        this._memo.set(node, this._contentHash(node) + this._childHash(node));
    }

    _contentHash(node) {
        const sortedAttrList = new Array(...node.attributes.keys()).sort()
        let content = node.label;
        for (const key of sortedAttrList) {
            content += key + "=" + node.attributes.get(key);
        }
        if (node.data != null) {
            content += node.data;
        }
        return StringHash.hash(content);
    }

    _childHash(node) {
        let childHash = 0;
        if (node.hasInternalOrdering()) {
            //preserve order by multiplying child hashes with distinct prime number based on index
            const primes = PrimeGenerator.primes(node.numChildren());
            //todo built in map function
            childHash += node
                .childNodes
                .map((n, i) => this.get(n) * primes[i])
                .reduce((prev, curr) => prev + curr, 0);
        } else {
            //arbitrary order, achieved by simple addition
            childHash += node
                .childNodes
                .map(n => this.get(n))
                .reduce((prev, curr) => prev + curr, 0);
        }
        return childHash;
    }


}