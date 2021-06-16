#!/usr/bin/env node

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

const assert = require("assert");
const {TestRepository} = require("./TestRepository");
const {CpeeNode} = require("../prototypes/cpee/CpeeNode");

describe("CpeeNode", () => {

    const newNodeLabel = "123456789";
    let newNode;

    let model;
    let bookAirCall;

    beforeEach(() => {
        newNode = new CpeeNode(newNodeLabel);
        newNode.attributes.set("attrA", "valA");
        newNode.attributes.set("attrB", "valB");
        newNode.data = "dataVal";

        model = TestRepository.bookingModel();
        bookAirCall = model.root.getChild(0);
    });

    describe("#copy()", () => {
        it('should copy a node, including its content and child nodes (if specified)',() => {
            //do not copy child nodes
            let copy = newNode.copy(false);

            //verify content equality
            assert.strictEqual(copy.numChildren(), 0);
            assert.strictEqual(copy.data, newNode.data);
            assert.strictEqual(copy.attributes.size, newNode.attributes.size);
            for(const key of newNode.attributes.keys()) {
                assert.strictEqual(copy.attributes.get(key), newNode.attributes.get(key));
            }

            //verify reference inequality
            assert.notStrictEqual(copy, newNode);

            //insert one child
            newNode.appendChild(new CpeeNode("dummy"));

            //do copy child nodes
            copy = newNode.copy(true);

            //verify structural equality
            assert.strictEqual(copy.numChildren(), newNode.numChildren());
            assert.ok(copy.getChild(0).contentEquals(newNode.getChild(0)));
        });
    });


    describe("#contentEquals()", () => {
        it('should detect content equality between two nodes, excluding child nodes',() => {
            //do not copy child nodes
            const copy = newNode.copy(false);
            //insert one child
            copy.appendChild(new CpeeNode("dummy"));

            assert.ok(newNode.contentEquals(copy));

            //change the copy a bit
            copy.data = "123";
            assert.strictEqual(newNode.contentEquals(copy), false);
        });
    });

    describe("#appendChild()", () => {
        it('should append child at the end of node',() => {
            model.root.appendChild(newNode);

            const lastChild = model.root.getChild(model.root.numChildren() - 1);
            assert.ok(newNode.contentEquals(lastChild));

            assert.strictEqual(newNode.parent, model.root);
        });
    });

    describe("#insertChild()", () => {
        it('should insert child at specified index',() => {
            const insertionIndex = 1;

            model.root.insertChild(insertionIndex, newNode);

            const child = model.root.getChild(insertionIndex);
            assert.ok(newNode.contentEquals(child));

            assert.strictEqual(newNode.parent, model.root);
        });
    });

    describe("#removeFromParent()", () => {
        it('should remove the node from its parent',() => {
            bookAirCall.removeFromParent();
            assert.notStrictEqual(model.root.getChild(0), bookAirCall);

            //child indices should be adjust accordingly
            assert.strictEqual(model.root.getChild(1).childIndex, 1);
        });
    });

    describe("#changeChildIndex()", () => {
        it('should move a node to a different position within its child list',() => {
            const newIndex = 1;

            bookAirCall.changeChildIndex(newIndex);

            assert.strictEqual(bookAirCall.childIndex, newIndex);
            //parent should not change
            assert.strictEqual(bookAirCall.parent, model.root);
        });
    });

    describe("#hash()", () => {
        it('should produce a unique hash for the subtree rooted at the node',() => {
            //hash should be a number
            assert.ok(model.root.hash().constructor === Number);

            //hash should be equal for equal subtrees
            assert.strictEqual(model.copy().root.hash(), model.root.hash());

            //hash should be different for different subtrees
            let copy = model.copy();
            bookAirCall.attributes.set("newAttribute", "newVal");
            assert.notStrictEqual(model.root.hash(), copy.root.hash());

            //permutation of unordered child lists should not affect the hash
            copy = model.copy();
            bookAirCall.getChild(0).changeChildIndex(2);
            assert.strictEqual(model.root.hash(), copy.root.hash());
        });
    });
});

