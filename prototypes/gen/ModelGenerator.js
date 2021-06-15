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

const {Preprocessor} = require("../parse/Preprocessor");
const {Dsl} = require("../Dsl");
const {CpeeModel} = require("../cpee/CpeeModel");
const {CpeeNode} = require("../cpee/CpeeNode");

class ModelGenerator {

    static ENDPOINT_METHODS = [":get", ":post", ":put", ":patch", ":delete"];
    static CHOOSE_MODES = ["inclusive", "exclusive"];

    variables = ["costs", "persons", "duration", "val", "res", "input", "output"];
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

        //at least 10 endpoints and labels
        this.endpoints = [];
        this.labels = [];
        this.variables = [];
        for (let i = 0; i < Math.max(Math.sqrt(this.maxSize), 10); i++) {
            this.endpoints.push(this.randomString(this.randInt(20) + 10));
            this.labels.push(this.randomString(this.randInt(20) + 10));
            this.variables.push(this.randomString(this.randInt(10) + 5));
        }

        return new Preprocessor().prepareModel(new CpeeModel(this.randomRoot()));
    }

    randomFrom(collection, amount = 1) {
        if(collection.constructor === Set) {
            let i = 0;
            const randIndex = this.randInt(collection.size);
            for(const element of collection) {
                if(i === randIndex) return element;
                i++;
            }
        }
        if (collection.constructor === Array) {
            return collection[this.randInt(collection.length)];
        }
    }

    randomSubSet(collection, amount) {
        const res = [];
        for (let i = 0; i < amount; i++) {
            res.push(this.randomFrom(collection));
        }
        return new Set(res);
    }

    randInt(max) {
        return Math.floor(Math.random() * max);
    }

    randomString(length = this.randInt(100)) {
        const result = [];
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < length; i++) {
            result.push(characters.charAt(this.randInt(characters.length)));
        }
        return result.join('');
    }

    randomRoot() {
        const node = new CpeeNode(Dsl.KEYWORDS.ROOT.label);
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
        const rand = this.randInt(100);

        //about two-third chance to add a call
        if(rand < 65) {
            return this.randomCall();
        } else if(rand < 90) {
            return this.randomManipulate();
        } else if (rand < 93) {
            return this.randomStop();
        } else if(rand < 97)  {
            return this.randomEscape();
        } else {
            return this.randomTerminate();
        }
    }


    randomInnerNode() {
        //inner nodes are evenly distributed
        switch (this.randomFrom(Dsl.INNER_NODE_SET)) {
            case Dsl.KEYWORDS.LOOP.label:
                return this.randomLoop();
            case Dsl.KEYWORDS.CHOOSE.label:
                return this.randomChoose();
            case Dsl.KEYWORDS.PARALLEL.label:
                return this.randomParallel();
            case Dsl.KEYWORDS.CRITICAL.label:
                return this.randomCritical();
            default:
                return this.randomLoop();
        }
    }

    randomCall() {
        const node = new CpeeNode(Dsl.KEYWORDS.CALL.label);
        node.attributes.set("endpoint", this.randomFrom(this.endpoints));

        const parameters = new CpeeNode("parameters");

        //random label
        const label = new CpeeNode("label");
        label.data = this.randomFrom(this.labels);
        parameters.appendChild(label);

        //random method
        const method = new CpeeNode("method");
        method.data = this.randomFrom(ModelGenerator.ENDPOINT_METHODS);
        parameters.appendChild(method);

        //random arguments (read Variables)
        const args = new CpeeNode("arguments");
        for(const readVariable of this.randomSubSet(this.variables, this.randInt(this.maxVars))) {
            const arg = new CpeeNode(readVariable);
            arg.data = "data." + readVariable;
            args.appendChild(arg);
        }
        parameters.appendChild(args);

        //random modified Variables
        const code = new CpeeNode("code");
        const codeUpdate = new CpeeNode("update");
        codeUpdate.data = "";
        for(const modifiedVariable of this.randomSubSet(this.variables, this.randInt(this.maxVars))) {
            codeUpdate.data += "data." + modifiedVariable + " = 420;"
        }
        code.appendChild(codeUpdate);

        node.appendChild(parameters);
        node.appendChild(code);

        return node;
    }

    randomManipulate() {
        const node = new CpeeNode(Dsl.KEYWORDS.MANIPULATE.label);

        //random modified Variables
        node.data = "";
        for(const modifiedVariable of this.randomSubSet(this.variables, this.randInt(this.maxVars))) {
            node.data += "data." + modifiedVariable + " = 420;"
        }

        return node;
    }

    randomStop() {
        const node = new CpeeNode(Dsl.KEYWORDS.STOP.label);
        return node;
    }

    randomEscape() {
        const node = new CpeeNode(Dsl.KEYWORDS.ESCAPE.label);
        return node;
    }

    randomTerminate() {
        const node = new CpeeNode(Dsl.KEYWORDS.TERMINATE.label);
        return node;
    }

    randomParallel() {
        const node = new CpeeNode(Dsl.KEYWORDS.PARALLEL.label);
        for (let i = 0; i < this.randInt(this.maxWidth); i++) {
            node.insertChild(this.randInt(i), this.randomParallelBranch());
        }
        return node;
    }

    randomParallelBranch() {
        this._currDepth++;
        const node = new CpeeNode(Dsl.KEYWORDS.PARALLEL_BRANCH.label);
        for (let i = 0; i < this.randInt(this.maxWidth); i++) {
            node.insertChild(this.randInt(i), this.randomNode());
        }
        this._currDepth--;
        return node;
    }

    randomChoose() {
        const node = new CpeeNode(Dsl.KEYWORDS.CHOOSE.label);
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
        const node = new CpeeNode(Dsl.KEYWORDS.ALTERNATIVE.label);

        //random condition
        const readVariable = this.randomFrom(this.variables);
        node.attributes.set("condition", "data." + readVariable + " < 69");

        for (let i = 0; i < this.randInt(this.maxWidth); i++) {
            node.insertChild(this.randInt(i), this.randomNode());
        }
        this._currDepth--;
        return node;
    }

    randomOtherwise() {
        this._currDepth++;
        const node = new CpeeNode(Dsl.KEYWORDS.OTHERWISE.label);
        for (let i = 0; i < this.randInt(this.maxWidth); i++) {
            node.insertChild(this.randInt(i), this.randomNode());
        }
        this._currDepth--;
        return node;
    }

    randomLoop() {
        const node = new CpeeNode(Dsl.KEYWORDS.LOOP.label);

        //random condition
        const readVariable = this.randomFrom(this.variables);
        node.attributes.set("condition", "data." + readVariable + " < 69");

        for (let i = 0; i < this.randInt(this.maxWidth); i++) {
            node.insertChild(this.randInt(i), this.randomNode());
        }
        return node;
    }

    randomCritical() {
        const node = new CpeeNode(Dsl.KEYWORDS.CRITICAL.label);
        for (let i = 0; i < this.randInt(this.maxWidth); i++) {
            node.insertChild(this.randInt(i), this.randomNode());
        }
        return node;
    }

}

exports.ModelGenerator = ModelGenerator;