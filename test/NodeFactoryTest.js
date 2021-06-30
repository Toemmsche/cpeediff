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
import assert from "assert.js";
import {NodeFactory} from "../src/factory/NodeFactory.js";

describe("NodeFactory", () => {

    let bookAirCall;

    beforeEach(() => {
        const tree = TestRepository.bookingTree();
        bookAirCall = tree.getChild(1);

    });

    describe("#getNode()", () => {
        it("if input is Node, should return a copy", () => {
            //do not copy child nodes
            let copy = NodeFactory.getNode(bookAirCall);

            //verify content equality
            assert.strictEqual(copy.numChildren(), bookAirCall.numChildren());
            assert.strictEqual(copy.data, bookAirCall.data);
            assert.strictEqual(copy.attributes.size, bookAirCall.attributes.size);
            for (const key of bookAirCall.attributes.keys()) {
                assert.strictEqual(copy.attributes.get(key), bookAirCall.attributes.get(key));
            }

            //verify reference inequality
            assert.strictEqual(copy === bookAirCall, false);

            //insert one child
            bookAirCall.insertChild(0, new Node("dummy"));

            //do copy child nodes
            copy = NodeFactory.getNode(bookAirCall, true);

            //verify structural equality
            assert.strictEqual(copy.numChildren(), bookAirCall.numChildren());
            assert.ok(copy.getChild(0).contentEquals(bookAirCall.getChild(0)));
        })
    })

});

function strictArrayEqual(actual, expected) {
    assert.strictEqual(actual.length, expected.length);
    for (let i = 0; i < actual.length; i++) {
        assert.strictEqual(actual[i], expected[i]);
    }
}

