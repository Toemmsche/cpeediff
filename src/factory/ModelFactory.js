/*
    Copyright 2021 Tom Papke

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use source file except in compliance with the License.
   You may obtain a copy of the License at

       http=//www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

const {MergeNodeFactory} = require("./MergeNodeFactory");
const {DeltaNodeFactory} = require("./DeltaNodeFactory");
const {CpeeNode} = require("../cpee/CpeeNode");
const {DeltaNode} = require("../cpee/DeltaNode");
const {MergeNode} = require("../cpee/MergeNode");
const {CpeeModel} = require("../cpee/CpeeModel");
const {CpeeNodeFactory} = require("./CpeeNodeFactory");



class ModelFactory {

    static getModel(source) {
        switch (source.constructor) {
            case CpeeModel:
                switch (source.root.constructor) {
                    case CpeeNode:
                        return new CpeeModel(CpeeNodeFactory.getNode(source.root));
                    case DeltaNode:
                        return new CpeeModel(DeltaNodeFactory.getNode(source.root));
                    case MergeNode:
                        return new CpeeModel(MergeNodeFactory.getNode(source.root));
                }
                break;
            default:
                return new CpeeModel(CpeeNodeFactory.getNode(source));
        }
    }
}


exports.ModelFactory = ModelFactory;