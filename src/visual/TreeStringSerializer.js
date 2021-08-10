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

import {Node} from "../tree/Node.js"
import {HashExtractor} from "../extract/HashExtractor.js";

export class TreeStringSerializer {
    
    //similar to unix tree command
    static serializeTree(tree) {
        return constructRecursive(tree, []);

        function constructRecursive(node, barList) {
            const isLast = node._parent != null && node._index === node._parent._children.length - 1;
            let line = "";
            for (let i = 0; i < barList.length; i++) {
                const spaceCount = barList[i] - (i > 0 ? barList[i - 1] : 0) - 1;
                line += " ".repeat(spaceCount);
                if (i === barList.length - 1) {
                    if (isLast) {
                        line += "└";
                    } else {
                        line += "├";
                    }
                } else {
                    line += "│";
                }
            }
            if (isLast) {
                barList.pop();
            }
            line += "─";
            const lineLength = line.length;
            //TODO rework
            line += node.toString() + new HashExtractor().get(node) + "\n";
            if (node.hasChildren()) {
                barList.push(lineLength + 1);
                for (const child of node) {
                    line += constructRecursive(child, barList);
                }
            }
            return line;
        }
    }

    static serializeDeltaTree(deltaTree) {
        return this.serializeTree(deltaTree);
    }
}

