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

export class Matching {

    /**
     * @type Map<Node,Node>
     */
    newToOldMap;
    oldToNewMap;


    constructor(oldToNewMap = new Map(), newToOldMap = new Map() ) {
        this.newToOldMap = newToOldMap;
        this.oldToNewMap = oldToNewMap;
    }

    matchNew(newNode, oldNode) {
        if(this.oldToNewMap.has(oldNode) || this.newToOldMap.has(newNode)) {
            throw new Error("matching of already matched node");
        }
        if(newNode == null || oldNode == null) {
            throw new Error();
        }
        this.newToOldMap.set(newNode, oldNode);
        this.oldToNewMap.set(oldNode, newNode);
    }

    getNew(newNode) {
        return this.newToOldMap.get(newNode);
    }


    getOld(oldNode) {
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
        return this.oldToNewMap.has(oldNode);
    }

    areMatched(oldNode, newNode) {
        return this.hasNew(newNode) && this.getNew(newNode) === oldNode;
    }

    size() {
        return this.newToOldMap.size;
    }

}

