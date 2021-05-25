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

const {AbstractDiff} = require("../AbstractDiff");
const {CpeeModel} = require("../CPEE/CpeeModel");

class SampleDiff extends AbstractDiff {

    constructor(model1, model2, options= []) {
       super(model1, model2, options);
    }


    diff() {
        /**
         * Assumptions: - Nodes are (almost) unique. Their fingerprints are different.
         *              - Insertion and deletion of the same node is always a move.
         *              - Nodes that don't appear in both trees are removed entirely.
         *              - Non-leaf nodes are always relabeled (loops don't have names)
         *              - root always has the same name (description)
         */

        /*
        Thoughts:
        Find deleted/inserted nodes via set diff
        -> Delete nodes
        -> insert leaf nodes
        -> move nodes
         */

        //TODO set diff
        const preOrder1 = this.model1.toPreOrderArray();
        const preOrder2 = this.model2.toPreOrderArray();

        const deleted = [];
        const inserted = [];
        for (let i = 0; i < preOrder1.length; i++) {
            if(preOrder2.filter(n => n.nodeEquals(preOrder1[i])).length === 0) {
                deleted.push(preOrder1[i]);
            }
        }
        for (let i = 0; i < preOrder2.length; i++) {
            if(preOrder1.filter(n => n.nodeEquals(preOrder2[i])).length === 0) {
                inserted.push(preOrder2[i]);
            }
        }
        //Idea: count for each parent node how many child nodes are deleted. if we match childnodes.legnth, we have subtree deletion
        function allDeleted(cpeeNode) {
            if(!deleted.includes(cpeeNode)) return false;
            for(const child of cpeeNode.childNodes) {
                if(!allDeleted(child)) return false;
            }
            return true;
        }

        for(const node of deleted) {
           node.subTreeDelete = allDeleted(node);
        }

        function allInserted(cpeeNode) {
            if(!inserted.includes(cpeeNode)) return false;
            for(const child of cpeeNode.childNodes) {
                if(!allInserted(child)) return false;
            }
            return true;
        }

        for(const node of inserted) {
            node.subTreeInsert = allInserted(node);
        }

        const stayed1 = [];
        stayed1.push(...preOrder1.filter(n => !deleted.includes(n)));

        const stayed2 = [];
        stayed2.push(...preOrder2.filter(n => !inserted.includes(n)));

        //map remaining nodes in model 1 to their partner in model 2
        for (let i = 0; i < stayed1.length; i++) {
            const partner = stayed2.filter(n => n.nodeEquals(stayed1[i]))[0];
            stayed1[i].buddy = partner;
            partner.buddy = stayed1[i];
        }



        for (const stayedNode of stayed1) {
            if(stayedNode.path.toString() !== stayedNode.buddy.path.toString()) {//|| stayedNode.childIndex !== stayedNode.buddy.childIndex) { TODO CONSIDER DEPENDENCY SEMANTIC
                stayedNode.OP = "MOVE";
                stayedNode.buddy.OP = "MOVE";
            } else {
                stayedNode.OP = "STAY";
                stayedNode.buddy.OP = "STAY";
            }
        }
        const movedNodes = stayed1.filter(n => n.OP === "MOVE");

        const nodeSet = new Set();
        deleted.forEach(n => nodeSet.add(n.tag));
        inserted.forEach(n => nodeSet.add(n.tag));
        movedNodes.forEach(n => nodeSet.add(n.tag));
        const dependencyMap = new Map();
        for(const node of nodeSet) {
            dependencyMap.set(node, []);
        }
        for(const deletedNode of deleted) {
           for(const child of deletedNode.childNodes) {
               dependencyMap.get(deletedNode.tag).push(child.tag);
           }
        }
        for(let insertedNode of inserted) {
            if(insertedNode.parent.OP !== "STAY") {
                dependencyMap.get(insertedNode.tag).push(insertedNode.parent.tag);
            }
        }
        for(const movedNode of movedNodes) {
            for(const child of movedNode.childNodes) {
                dependencyMap.get(movedNode.tag).push(child.tag);
            }
            if(movedNode.buddy.parent.OP !== "STAY") {
                dependencyMap.get(movedNode.tag).push(movedNode.buddy.parent.tag);
            }
        }

        //we can use topological sort to find delete/insert/move order
        console.log("lol");
    }
}

exports.SampleDiff = SampleDiff;