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
const { DOMParser, XMLSerializer } = require("xmldom");
const vkbeautify = require("vkbeautify");


/**
 * Helper class to manipulate/generate XML documents.
 */
class XMLTools {

    /**
     * Sorts all child nodes lexicographically where permitted by the semantic of the CPEE syntax.
     * @param xml The unordered CPEE process model as an XML document string.
     * @return {string} The ordered CPEE process model as an XML document string.
     */
    static sortXML(xml) {
        let doc = new DOMParser().parseFromString(xml, "text/xml");
        sortRecursive(doc);
        //xmldom serializer messes up newlines
        //use vkbeautify for proper formatting and remove all indentations
        return vkbeautify.xml(new XMLSerializer().serializeToString(doc), 1).toString().replaceAll(/\r?\n\s*/g, "\n");

        function sortRecursive(tNode) {
            //xmldom doesn't provide iterable child nodes, we have to remove, sort and reinsert them on our own
            let childArr = [];
            if (tNode.hasChildNodes()) {
                for (let i = 0; i < tNode.childNodes.length; i++) {
                    sortRecursive(tNode.childNodes.item(i));
                    childArr.push(tNode.childNodes.item(i));
                }
            }

            //Consider CPEE semantics! Only sort if child nodes can be sorted arbitrarily.
            if (!CPEESyntax.hasInternalOrdering(tNode.nodeName)) {
                childArr.sort((tNodeA, tNodeB) => tNodeA.nodeName.localeCompare(tNodeB.nodeName));
                while (tNode.hasChildNodes()) {
                    tNode.removeChild(0);
                }
                for (let childNode of childArr) {
                    tNode.appendChild(childNode);
                }
            }
        }
    }
}

module.exports = XMLTools;