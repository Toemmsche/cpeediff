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

const {CpeeNode} = require("../CPEE/CpeeNode");

class TreeStringSerializer {
    
    //similar to unix tree command
    static serializeModel(model) {
        return constructRecursive(model.root, []);

        function constructRecursive(cpeeNode, barList) {
            const isLast = cpeeNode._parent != null && cpeeNode._childIndex === cpeeNode._parent._childNodes.length - 1;
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
            line += cpeeNode.toString(CpeeNode.STRING_OPTIONS.CHANGE) + "\n";
            if (cpeeNode.hasChildren()) {
                barList.push(lineLength + 1);
                for (const child of cpeeNode) {
                    line += constructRecursive(child, barList);
                }
            }
            return line;
        }
    }
}

exports.TreeStringSerializer = TreeStringSerializer;