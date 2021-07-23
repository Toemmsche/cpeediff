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

import xmldom from "xmldom";
import {EditScript} from "./EditScript.js";
import {ChangeFactory} from "./ChangeFactory.js";

export class EditScriptFactory {

    static getEditScript(source) {
        switch (source.constructor) {
            case String:
                return this._fromXmlString(source);
            default:
                return this._fromXmlDom(source);
        }
    }

    static _fromXmlDom(xmlElement) {
        const editScript = new EditScript();
        if(xmlElement.hasAttribute("cost") != null) {
            editScript.cost = parseInt(xmlElement.getAttribute("cost"));
        }
        for (let i = 0; i < xmlElement.childNodes.length; i++) {
            const childNode = xmlElement.childNodes.item(i);
            if (childNode.nodeType === 1) {
                editScript.changes.push(ChangeFactory.getChange(childNode));
            }
        }
        return editScript;
    }

    static _fromXmlString(xml) {
        return this._fromXmlDom(new xmldom.DOMParser().parseFromString(xml, "text/xml").firstChild);
    }
}