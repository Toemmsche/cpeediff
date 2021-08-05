/*
    Copyright 2021 Tom Papke

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http=//www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

import {NodeFactory} from "../tree/NodeFactory.js";
import {EditOperation} from "./EditOperation.js";
import xmldom from "xmldom";
import {DomHelper} from "../../util/DomHelper.js";

export class ChangeFactory {

    static getChange(source) {
        switch (source.constructor) {
            case String: return this._fromXmlString(source);
            default: return this._fromXmlDom(source);
        }
    }

    static _fromXmlDom(xmlElement) {
        const [type, oldPath, newPath] = [xmlElement.localName, xmlElement.getAttribute("oldPath"), xmlElement.getAttribute("newPath")];
        let newContent;
        const xmlContent = DomHelper.firstChildElement(xmlElement);
        if(xmlContent != null) {
            newContent = NodeFactory.getNode(xmlContent);
        }
        return new EditOperation(type, oldPath, newPath, newContent);
    }

    static _fromXmlString(xml) {
        return this._fromXmlDom(new xmldom.DOMParser().parseFromString(xml, "text/xml"));
    }
}