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

const {Dsl} = require("../Dsl");
const {CpeeModel} = require("../cpee/CpeeModel");
const {CpeeNode} = require("../cpee/CpeeNode");
const {Serializable} = require("../utils/Serializable");

class ModelGenerator {

    static INNER_NODES = ["parallel", "critical", "loop", "choose"];
    static LEAF_NODES = ["call", "manipulate", "stop", "escape", "terminate"];

    static ENDPOINT_METHODS = [":get", ":post", ":put", ":patch", ":delete"];
    static CHOOSE_MODES = ["inclusive", "exclusive"];

    variables = ["aaa", "bbb", "ccc", "ddd", "eee", "fff", "ggg"];
    endpoints = ["bookAir", "bookHotel"];
    labels = ["Book Airline", "Book Hotel"];


    maxDepth;
    maxWidth;
    maxVars;

    _currSize;
    _currDepth;

    constructor(maxSize, maxDepth, maxWidth, maxVars) {
        this.maxSize = maxSize;
        this.maxDepth = maxDepth;
        this.maxWidth = maxWidth;
        this.maxVars = maxVars;
    }

    //use prototype nodes

    randomModel() {
        this._currDepth = 0;
        this._currSize = 0;
        return new CpeeModel(this.randomRoot(), new Set(this.variables))
    }

    randomFrom(collection,) {
        let randIndex;
        if (collection.constructor === Set) {
            randIndex = this.randInt(collection.size);
            let i = 0;
            for (const element of collection) {
                if (randIndex === i) return element;
                i++;
            }
        } else if (collection.constructor === Array) {
            randIndex = this.randInt(collection.length);
            return collection[randIndex];
        }
    }

    randomInto(source, destination, amount) {
        for (let i = 0; i < amount; i++) {
            if (destination.constructor === Set) {
                destination.add(this.randomFrom(source));
            } else {
                destination.push(this.randomFrom(source));
            }
        }
    }

    randInt(max) {
        return Math.floor(Math.random() * max);
    }

    randomString(length = this.randInt(100)) {
        const result = [];
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result.push(characters.charAt(Math.floor(Math.random() *
                charactersLength)));
        }
        return result.join('');
    }

    randomRoot() {
        const node = new CpeeNode(Dsl.KEYWORDS.ROOT);
        for (let i = 0; i < this.randInt(this.maxWidth); i++) {
            node.insertChild(this.randInt(i), this.randomNode());
        }
        return node;
    }

    randomNode() {
        this._currSize++;
        if (this._currSize >= this.maxSize || this.randInt(2) === 1 || Math.random() <= this._currDepth / this.maxDepth) {
            return this.randomLeafNode();
        } else {
            this._currDepth++;
            const node = this.randomInnerNode();
            this._currDepth--;
            return node;
        }
    }

    randomLeafNode() {
        const r = this.randomFrom(ModelGenerator.LEAF_NODES);
        switch (this.randomFrom(ModelGenerator.LEAF_NODES)) {
            case Dsl.KEYWORDS.CALL:
                return this.randomCall();
            case Dsl.KEYWORDS.MANIPULATE:
                return this.randomManipulate();
            case Dsl.KEYWORDS.STOP:
                return this.randomStop();
            case Dsl.KEYWORDS.ESCAPE:
                return this.randomEscape();
            case Dsl.KEYWORDS.TERMINATE:
                return this.randomTerminate();
            default:
                return this.randomCall();
        }
    }


    randomInnerNode() {
        switch (this.randomFrom(ModelGenerator.INNER_NODES)) {
            case Dsl.KEYWORDS.LOOP:
                return this.randomLoop();
            case Dsl.KEYWORDS.CHOOSE:
                return this.randomChoose();
            case Dsl.KEYWORDS.PARALLEL:
                return this.randomParallel();
            case Dsl.KEYWORDS.CRITICAL:
                return this.randomCritical();
            default:
                return this.randomLoop();
        }
    }

    randomCall() {
        const node = new CpeeNode(Dsl.KEYWORDS.CALL);
        node.attributes.set("endpoint", this.randomFrom(this.endpoints));
        node.attributes.set("./parameters/label", this.randomFrom(this.labels));
        node.attributes.set("./parameters/method", this.randomFrom(ModelGenerator.ENDPOINT_METHODS));

        node.attributes.set("./code/prepare", this.randomString());
        node.attributes.set("./code/finalize", this.randomString());
        node.attributes.set("./code/update", this.randomString());
        node.attributes.set("./code/rescue", this.randomString());

        this.randomInto(this.variables, node.readVariables, this.randInt(this.maxVars));
        this.randomInto(this.variables, node.modifiedVariables, this.randInt(this.maxVars));
        return node;
    }

    randomManipulate() {
        const node = new CpeeNode(Dsl.KEYWORDS.MANIPULATE);
        this.randomInto(this.variables, node.readVariables, this.randInt(this.maxVars));
        this.randomInto(this.variables, node.modifiedVariables, this.randInt(this.maxVars));
        return node;
    }

    randomStop() {
        const node = new CpeeNode(Dsl.KEYWORDS.STOP);
        return node;
    }

    randomEscape() {
        const node = new CpeeNode(Dsl.KEYWORDS.ESCAPE);
        return node;
    }

    randomTerminate() {
        const node = new CpeeNode(Dsl.KEYWORDS.TERMINATE);
        return node;
    }

    randomParallel() {
        const node = new CpeeNode(Dsl.KEYWORDS.PARALLEL);
        for (let i = 0; i < this.randInt(this.maxWidth); i++) {
            node.insertChild(this.randInt(i), this.randomParallelBranch());
        }
        return node;
    }

    randomParallelBranch() {
        this._currDepth++;
        const node = new CpeeNode(Dsl.KEYWORDS.PARALLEL_BRANCH);
        for (let i = 0; i < this.randInt(this.maxWidth); i++) {
            node.insertChild(this.randInt(i), this.randomNode());
        }
        this._currDepth--;
        return node;
    }

    randomChoose() {
        const node = new CpeeNode(Dsl.KEYWORDS.CHOOSE);
        node.attributes.set("mode", this.randomFrom(ModelGenerator.CHOOSE_MODES));

        let i;
        for (i = 0; i < this.randInt(this.maxWidth); i++) {
            node.insertChild(this.randInt(i), this.randomAlternative());
        }
        node.insertChild(this.randInt(i), this.randomOtherwise());

        return node;
    }

    randomAlternative() {
        this._currDepth++;
        const node = new CpeeNode(Dsl.KEYWORDS.ALTERNATIVE);
        node.attributes.set("condition", this.randomString());
        this.randomInto(this.variables, node.readVariables, this.randInt(this.maxVars));
        for (let i = 0; i < this.randInt(this.maxWidth); i++) {
            node.insertChild(this.randInt(i), this.randomNode());
        }
        this._currDepth--;
        return node;
    }

    randomOtherwise() {
        this._currDepth++;
        const node = new CpeeNode(Dsl.KEYWORDS.OTHERWISE);
        for (let i = 0; i < this.randInt(this.maxWidth); i++) {
            node.insertChild(this.randInt(i), this.randomNode());
        }
        this._currDepth--;
        return node;
    }

    randomLoop() {
        const node = new CpeeNode(Dsl.KEYWORDS.LOOP);
        node.attributes.set("condition", this.randomString());
        this.randomInto(this.variables, node.readVariables, this.randInt(this.maxVars));
        for (let i = 0; i < this.randInt(this.maxWidth); i++) {
            node.insertChild(this.randInt(i), this.randomNode());
        }
        return node;
    }

    randomCritical() {
        const node = new CpeeNode(Dsl.KEYWORDS.CRITICAL);
        for (let i = 0; i < this.randInt(this.maxWidth); i++) {
            node.insertChild(this.randInt(i), this.randomNode());
        }
        return node;
    }

}

exports.ModelGenerator = ModelGenerator;