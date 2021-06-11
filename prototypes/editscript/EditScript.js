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

const fs = require("fs");
const xmldom= require("xmldom");
const vkbeautify = require("vkbeautify");
const {Change} = require("./Change");
const {Dsl} = require("../Dsl");
const {Serializable} = require("../utils/Serializable");

class EditScript extends Serializable {

    changes;

    constructor() {
        super();
        this.changes = [];
    }

    static parseFromJson(str) {
        return JSON.parse(str);
    }

    toString() {
        return this.changes.map(c => c.toString()).join("\n");
    }

    insert(newPath, newData, subtree = false) {
        this.changes.push(new Change(subtree ? Dsl.CHANGE_TYPES.SUBTREE_INSERTION : Dsl.CHANGE_TYPES.INSERTION, null, newPath, newData));
    }

    delete(oldPath, subtree = false) {
        this.changes.push(new Change(subtree ? Dsl.CHANGE_TYPES.SUBTREE_DELETION : Dsl.CHANGE_TYPES.DELETION, oldPath, null,  null));
    }

    move(oldPath, newPath) {
        this.changes.push(new Change(Dsl.CHANGE_TYPES.MOVE_TO, oldPath,  newPath));
    }

    update(oldPath, newData) {
        this.changes.push(new Change(Dsl.CHANGE_TYPES.UPDATE, oldPath, null, newData));
    }

    convertToXml(xmlDom = false) {
        const doc = xmldom
            .DOMImplementation
            .prototype
            .createDocument(Dsl.NAMESPACES.DEFAULT_NAMESPACE_URI);

        const root = doc.createElement("delta");
        for(const change of this.changes) {
            const ch = change.convertToXml(true);
            root.appendChild(change.convertToXml(true));
        }

        if(xmlDom) {
            return root;
        } else {
            doc.insertBefore(root);
            return vkbeautify.xml(new xmldom.XMLSerializer().serializeToString(doc));
        }
    }

    [Symbol.iterator]() {
        return this.changes[Symbol.iterator]();
    }

}

exports.EditScript = EditScript;