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

const xmldom = require("xmldom");
const {CpeeNode} = require("../cpee/CpeeNode");
const {Config} = require("../Config");
const vkbeautify = require("vkbeautify");
const {Dsl} = require("../Dsl");
const {Change} = require("../editscript/Change");

class XmlSerializer {

    static serializeModel(model) {
       return model.root.convertToXml();
    }

    /**
     *
     * @param {CpeeModel} model
     */
    static serializeDeltaTree(model) {

    }
}

exports.XmlSerializer = XmlSerializer;