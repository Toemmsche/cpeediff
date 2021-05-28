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

    /**
     * @type Map<CpeeNode,Set<CpeeNode>>
     */
    newToOldMap;
    oldToNewMap;

    //flag for lazy propagation
    _needsPropagation;


    constructor(oldToNewMap = new Map(), newToOldMap = new Map() ) {
        this.newToOldMap = newToOldMap;
        this.oldToNewMap = oldToNewMap;
        this._needsPropagation = false;
    }

    matchNew(newNode, oldNode) {
        this._needsPropagation = true;
        if(!this.newToOldMap.has(newNode)) {
            this.newToOldMap.set(newNode, new Set());
        }
        if(!this.newToOldMap.get(newNode).has(oldNode)) {
            this.newToOldMap.get(newNode).add(oldNode);
        }
    }

    unMatchNew(newNode) {
        this._needsPropagation = true;
        if(this.newToOldMap.has(newNode)) {
           this.newToOldMap.set(newNode, new Set());
        }
    }

    getNew(newNode) {
        return this.newToOldMap.get(newNode);
    }

    getNewSingle(newNode) {
        return this.newToOldMap.get(newNode)[Symbol.iterator]().next().value;
    }

    getOld(oldNode) {
        this._propagate();
        return this.oldToNewMap.get(oldNode);
    }

    getOldSingle(oldNode) {
        this._propagate();
        return this.oldToNewMap.get(oldNode)[Symbol.iterator]().next().value;
    }

    hasAny(node) {
        return this.hasNew(node) || this.hasOld(node);
    }

    hasNew(newNode) {
        return this.newToOldMap.has(newNode) && this.newToOldMap.get(newNode).size > 0;
    }

    hasOld(oldNode) {
        this._propagate();
        return this.oldToNewMap.has(oldNode)&& this.oldToNewMap.get(oldNode).size > 0;
    }

    _propagate() {
        if (this._needsPropagation) {
            this.oldToNewMap = new Map();
            for(const [newNode, oldMatchSet] of this.newToOldMap) {
                for(const oldNode of oldMatchSet) {
                    if(!this.oldToNewMap.has(oldNode)) {
                        this.oldToNewMap.set(oldNode, new Set());
                    }
                    this.oldToNewMap.get(oldNode).add(newNode);
                }
            }
            this._needsPropagation = false;
        }
    }

    reduceNew(reducer) {
        for(const [newNode, matchSet] of this.newToOldMap) {
            if(matchSet.size > 1) {
                reducer(newNode, matchSet);
                if(matchSet.size > 1) {
                    throw new Error("Multiple matched nodes left after reduction");
                }
            }
        }
        this._needsPropagation = true;
    }

    [Symbol.iterator]() {
        return this.newToOldMap[Symbol.iterator]();
    }
}

exports.Matching = Matching;