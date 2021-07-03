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

import {Node} from "../src/tree/Node.js"
import {TestRepository} from "./TestRepository.js";
import {NodeFactory} from "../src/tree/NodeFactory.js";
import assert from "assert.js";

describe("Node", () => {

    //a new dummy node
    let newNode;
    const newNodeLabel = "123456789.js";

    //some nodes from the booking example
    let tree;
    let bookAirCall;
    let toArgument;

    beforeEach(() => {
        newNode = new Node(newNodeLabel);
        newNode.attributes.set("attrA", "valA");
        newNode.attributes.set("attrB", "valB");
        newNode.data = "dataVal.js";

        tree = TestRepository.bookingTree();
        bookAirCall = tree.getChild(0);
        toArgument = tree
            .getChild(0) //bookAirCall
            .getChild(0) //parameters
            .getChild(2) //arguments
            .getChild(1) //to
    });

    describe("#contentEquals()", () => {
        it('should detect content equality between two nodes, excluding child nodes', () => {
            //do not copy child nodes
            const copy = NodeFactory.getNode(newNode, false);
            //insert one child
            copy.appendChild(new Node("dummy"));

            assert.ok(newNode.contentEquals(copy));

            //change the copy a bit
            copy.data = "123.js";
            assert.strictEqual(newNode.contentEquals(copy), false);
        });
    });

    describe("#appendChild()", () => {
        it('should append child at the end of node', () => {
            tree.appendChild(newNode);

            const lastChild = tree.getChild(tree.numChildren() - 1);
            assert.ok(newNode.contentEquals(lastChild));

            assert.strictEqual(newNode.parent, tree);
        });
    });

    describe("#insertChild()", () => {
        it('should insert child at specified index', () => {
            const insertionIndex = 1;

            tree.insertChild(insertionIndex, newNode);

            const child = tree.getChild(insertionIndex);
            assert.ok(newNode.contentEquals(child));

            assert.strictEqual(newNode.parent, tree);
        });
    });

    describe("#removeFromParent()", () => {
        it('should remove the node from its parent', () => {
            bookAirCall.removeFromParent();
            assert.notStrictEqual(tree.getChild(0), bookAirCall);

            //child indices should be adjust accordingly
            assert.strictEqual(tree.getChild(1).childIndex, 1);
        });
    });

    describe("#changeChildIndex()", () => {
        it('should move a node to a different position within its child list', () => {
            const newIndex = 1;

            bookAirCall.changeChildIndex(newIndex);

            assert.strictEqual(bookAirCall.childIndex, newIndex);
            //parent should not change
            assert.strictEqual(bookAirCall.parent , tree);
        });
    });

    describe("#hash()", () => {
        it('should produce a unique hash for the subtree rooted at the node', () => {
            //hash should be a number
            assert.ok(tree.hash().constructor === Number);

            //hash should be equal for equal subtrees
            assert.strictEqual(tree.copy().hash(), tree.hash());

            //hash should be different for different subtrees
            let copy = tree.copy();
            bookAirCall.attributes.set("newAttribute", "newVal");
            assert.notStrictEqual(tree.hash(), copy.hash());

            //permutation of unordered child lists should not affect the hash
            copy = tree.copy();
            bookAirCall.getChild(0).changeChildIndex(2);
            assert.strictEqual(tree.hash(), copy.hash());
        });
    });


    describe("#path()", () => {
        it('should return a sequence of nodes excluding the root that represent the path from the root to the node', () => {
            const parameters = bookAirCall.getChild(0);
            const args = parameters.getChild(2);

            const path = toArgument.path;
            strictArrayEqual(path, [bookAirCall, parameters, args, toArgument])
        });
    });

    describe("#toChildIndexPathString()", () => {
        it('should return the path from root to the node using child indices', () => {
            assert.strictEqual(toArgument.toChildIndexPathString(), "0/0/2/1");
        });
    });

    describe("#toPreorderArray()", () => {
        it('should return a sequence of nodes equivalent to a pre-order traversal of the subtree rooted at the node', () => {
            const preOrder = bookAirCall.toPreOrderArray();

            const parameters = bookAirCall.getChild(0);
            const label = parameters.getChild(0);
            const method = parameters.getChild(1);
            const args = parameters.getChild(2);
            const fromArgument = args.getChild(0);
            const personsArgument = args.getChild(2);
            const code = bookAirCall.getChild(1);
            const finalize = code.getChild(0);

            strictArrayEqual(preOrder, [bookAirCall, parameters, label, method, args, fromArgument, toArgument, personsArgument, code, finalize]);
        });
    });

    describe("#toPostorderArray()", () => {
        it('should return a sequence of nodes equivalent to a post-order traversal of the subtree rooted at the node', () => {
            const postOrder = bookAirCall.toPostOrderArray();

            const parameters = bookAirCall.getChild(0);
            const label = parameters.getChild(0);
            const method = parameters.getChild(1);
            const args = parameters.getChild(2);
            const fromArgument = args.getChild(0);
            const personsArgument = args.getChild(2);
            const code = bookAirCall.getChild(1);
            const finalize = code.getChild(0);

            strictArrayEqual(postOrder, [label, method, fromArgument, toArgument, personsArgument, args, parameters, finalize, code, bookAirCall]);
        });
    });
});

function strictArrayEqual(actual, expected) {
    assert.strictEqual(actual.length, expected.length);
    for (let i = 0; i < actual.length; i++) {
        assert.strictEqual(actual[i], expected[i]);
    }
}

