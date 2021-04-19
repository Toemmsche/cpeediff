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

const CPEESyntax = require("./CPEESyntax");

/**
 * Helper class to manipulate/generate xml documents.
 */
class XMLTools {

    /**
     * Transforms an XML document string into an in-memory tree representation.
     * @param xml The XML document string
     * @return {XMLNode} Root node of the XML tree
     */
    static transform(xml) {
        //TODO Improve readability and efficiency -> helper functions

        let root = new XMLNode();
        function parseAttributes(startIndex) {
            let i = startIndex;
            //skip tag
            while (xml.charAt(i) !== " " && xml.charAt(i) !== ">" && xml.substr(i, 2) !== "/>") {
                i++;
            }
            let attributeMap = new Map();
            //parse attributes
            while (xml.charAt(i) !== ">" && xml.substr(i, 2) !== "/>") {
                let j = i;
                while(xml.charAt(j) === " ") {
                    j++;
                }
                i = j;
                while(xml.charAt(j) !== " " && xml.charAt(j) !== ">" && xml.substr(j, 2) !== "/>") {
                    j++;
                }
                //append to map
                let attribute = xml.substring(i, j).split("=");
                attributeMap.set(attribute[0], attribute[1]);
                i = j;
            }
            return attributeMap;
        }

        function parseTag(startIndex) {
            let i = startIndex;
            while (xml.charAt(i) !== " " && xml.charAt(i) !== ">" && xml.substr(i, 2) !== "/>") {
                i++;
            }
            //skip "<" character
            return xml.substring(startIndex + 1, i);
        }

        function findEndOfContent(startIndex) {
            //start at character following startIndex
            let i = startIndex;
            let balance = 1;
            while (i < xml.length && balance !== 0) {
                i++;
                if (xml.substr(i, 2) === "</" || xml.substr(i, 2) === "/>") {
                    balance--;
                } else if (xml.charAt(i) === "<") {
                    balance++;
                }
            }
            return i;
        }

        function findBeginOfContent(startIndex) {
            while (xml.charAt(startIndex) !== ">") {
                startIndex++;
            }
            //skip closing character
            return startIndex + 1;
        }


        function traverseRec(startIndex, endOfContent) {
            let beginOfContent = findBeginOfContent(startIndex);

            let root = new XMLNode();

            root.tag = parseTag(startIndex);
            root.attributes = parseAttributes(startIndex);

            for (let i = beginOfContent; i < endOfContent; i++) {
                if (xml.charAt(i) === "<" && xml.substr(i, 2) !== "</") {
                    let endOfChild = findEndOfContent(i);
                    root.children.push(traverseRec(i, endOfChild));
                    i = endOfChild - 1;
                }
            }
            if (root.children.length === 0 && beginOfContent < endOfContent) {
                root.value = xml.substring(beginOfContent, endOfContent);
            }
            return root;
        }
        return traverseRec(0, findEndOfContent(0));
    }

    static order(xml) {
        return this.transform(xml).toStringOrdered();
    }
}

/**
 * A node in the XML tree of a CPEE process model.
 */
class XMLNode {
    tag;
    value;
    children;
    attributes;

    constructor() {
        this.tag = "";
        this.value = "";
        this.children = [];
        this.attributes = {};
    }

    /**
     * @return {string} The XML document string associated with this XML (sub-)tree.
     *                  If the child nodes of this node have no inherent order,
     *                  they will be sorted alphabetically by their tag.
     */
    toStringOrdered() {
        let str = `<${this.tag}`;
        for(let [attrKey, attrVal] of this.attributes.entries()) {
            str += " " + attrKey + "=" + attrVal;
        }
        str += `>${this.value}`;
        //nodes with no child nodes only occupy one line
        if(this.children.length > 0) {
            str += "\n";
            for(let child of
                (CPEESyntax.hasInternalOrdering(this.tag)
                    ? this.children
                    : this.children.sort((a,b) => a.tag.localeCompare(b.tag))
                )) {
                str += child.toStringOrdered() + "\n";
            }
        }
        str += `</${this.tag}>`;
        return str;
    }
}

module.exports = XMLTools;