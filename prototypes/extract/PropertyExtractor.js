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

const {AbstractExtractor} = require("./AbstractExtractor");

class PropertyExtractor extends AbstractExtractor {

    _extract(node) {
        if(node.isPropertyNode()) {
            throw new Error("Cannot extract properties from property node");
        }
        const map = new Map();
        this._memo.set(node, map);
        this._buildRecursive(node, map);
    }

    _buildRecursive(node, map) {
        if (node.data != null) { //lossy comparison
            //retain full (relative) structural information in the nodes
            map.set("./" + node.toPropertyPathString(), node.data);
        }

        //copy all values into new map
        for (const child of node.childNodes) {
            if(node.isPropertyNode()) {
                this._buildRecursive(child, map);
            }
        }
    }

}

exports.PropertyExtractor = PropertyExtractor;