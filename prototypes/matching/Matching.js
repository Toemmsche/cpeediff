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

const {CpeeModel} = require("../cpee/CpeeModel");


class Matching {

    /**
     * @type Map<CpeeNode,CpeeNode>
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
        this.newToOldMap.set(newNode, oldNode);
    }

    unmatchNew(newNode) {
        this._needsPropagation = true;
        this.newToOldMap.delete(newNode);
    }

    getNew(newNode) {
        return this.newToOldMap.get(newNode);
    }


    getOld(oldNode) {
        this._propagate();
        return this.oldToNewMap.get(oldNode);
    }

    getOther(node) {
        if(this.hasNew(node)) {
            return this.getNew(node);
        } else {
            return this.getOld(node);
        }
    }

    hasAny(node) {
        return this.hasNew(node) || this.hasOld(node);
    }

    hasNew(newNode) {
        return this.newToOldMap.has(newNode);
    }

    hasOld(oldNode) {
        this._propagate();
        return this.oldToNewMap.has(oldNode);
    }

    areMatched(oldNode, newNode) {
        //TODO replace wit hequals()
        return this.hasNew(newNode) && this.getNew(newNode) === oldNode;
    }

    _propagate() {
        if (this._needsPropagation) {
            this.oldToNewMap = new Map();
            for(const [newNode, oldMatch] of this.newToOldMap) {
                if(this.oldToNewMap.has(oldMatch)) {
                    const newMatch = this.oldToNewMap.get(oldMatch);
                    this.unmatchNew(newMatch);
                }
               this.oldToNewMap.set(oldMatch, newNode);
            }
            this._needsPropagation = false;
        }
    }

    [Symbol.iterator]() {
        return this.newToOldMap[Symbol.iterator]();
    }
}

exports.Matching = Matching;