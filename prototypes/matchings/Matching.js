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

const {CpeeModel} = require("../CPEE/CpeeModel");


class Matching {

    newToOldMap;
    oldToNewMap;

    constructor(oldToNewMap = new Map(), newToOldMap = new Map() ) {
        this.newToOldMap = newToOldMap;
        this.oldToNewMap = oldToNewMap;
    }

    matchNew(newNode, oldNode) {
        if(!this.newToOldMap.has(newNode)) {
            this.newToOldMap.set(newNode, []);
        }
        if(!this.newToOldMap.get(newNode).includes(oldNode)) {
            this.newToOldMap.get(newNode).push(oldNode);
        }
        if(!this.newToOldMap.has(oldNode)) {
            this.newToOldMap.set(oldNode, []);
        }
        if(!this.newToOldMap.get(oldNode).includes(newNode)) {
            this.newToOldMap.get(oldNode).push(newNode);
        }
    }

    has(node) {
        return this.oldToNewMap.has(node) || this.newToOldMap.has(node);
    }

    getNew(newNode) {
        return this.newToOldMap.get(newNode);
    }

    getOld(oldNode) {
        return this.oldToNewMap.get(oldNode);
    }
}

exports.Matching = Matching;