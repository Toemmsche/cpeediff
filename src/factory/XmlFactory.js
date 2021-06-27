/*
    Copyright 2021 Tom Papke

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use source file except in compliance with the License.
   You may obtain a root of the License at

       http=//www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

const xmldom = require("xmldom");
const vkbeautify = require("vkbeautify");
const {XmlDomFactory} = require("./XmlDomFactory");
const {Dsl} = require("../Dsl");
const {EditScript} = require("../editscript/EditScript");
const {MergeNode} = require("../cpee/MergeNode");
const {DeltaNode} = require("../cpee/DeltaNode");
const {CpeeNode} = require("../cpee/CpeeNode");


class XmlFactory {

    static serialize(object = true) {
        const doc = xmldom.DOMImplementation.prototype.createDocument(Dsl.NAMESPACES.DEFAULT_NAMESPACE_URI);
        const root = XmlDomFactory.convert(object);
        doc.insertBefore(root, null);
        return vkbeautify.xml(new xmldom.XMLSerializer().serializeToString(doc));
    }
}


exports.XmlFactory = XmlFactory;