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
const fs = require("fs");
const {DeltaMerger} = require("../prototypes/merge/DeltaMerger");
const {IdExtractor} = require("../prototypes/extract/IdExtractor");
const {ChawatheMatching} = require("../prototypes/matching/ChawatheMatch");
const {ExpectedMatch} = require("./matcheval/ExpectedMatch");
const {Preprocessor} = require("../prototypes/parse/Preprocessor");

const matchingAlgorithm = new ChawatheMatching();
describe("merge cases", () => {

    const pathPrefix = "test/test_set/merge_cases"
    fs.readdirSync(pathPrefix).forEach((dir) => {
        let baseTree;
        let branch1;
        let branch2;

        fs.readdirSync(pathPrefix + "/" + dir).forEach((file) => {
                const parser = new Preprocessor();
                const content = fs.readFileSync(pathPrefix + "/" + dir + "/" + file).toString();
                if (file === "base.xml") {
                    baseTree = parser.parseWithMetadata(content);
                } else if (file === "1.xml") {
                    branch1 = parser.parseWithMetadata(content);
                } else if (file === "2.xml") {
                    branch2 = parser.parseWithMetadata(content);
                }
            }
        );

        describe(dir, () => {
            //merge
            const merger = new DeltaMerger();

            it("should produce a valid merge result of the two branches", () => {
                const mergedTree = merger.merge(baseTree, branch1, branch2, new ChawatheMatching())
                console.log(mergedTree.convertToXml());
            })
        })
    })
});

