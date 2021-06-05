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
const {Change} = require("../editscript/Change");

class Patcher {
    static patch(model, editScript) {
        for (const change of editScript) {
            switch (change.changeType) {
                case Change.CHANGE_TYPES.INSERTION: {
                    const indexArr = change.newPath.split("/").map(str => parseInt(str));
                    const childIndex = indexArr.pop();
                    const parent = findNodeByIndexArr(model, indexArr);
                    const child = CpeeNode.parseFromJson(change.newData);
                    parent.insertChild(childIndex, child);
                    break;
                }
                case Change.CHANGE_TYPES.MOVE: {
                    const nodeIndexArr = change.oldPath.split("/").map(str => parseInt(str));
                    const node = findNodeByIndexArr(model, nodeIndexArr);
                    node.removeFromParent();
                    const parentIndexArr = change.newPath.split("/").map(str => parseInt(str));
                    const targetIndex = parentIndexArr.pop();
                    const parent = findNodeByIndexArr(model, parentIndexArr);
                    parent.insertChild(targetIndex, node);
                    break;
                }
                case Change.CHANGE_TYPES.UPDATE: {
                    const nodeIndexArr = change.oldPath.split("/").map(str => parseInt(str));
                    const node = findNodeByIndexArr(model, nodeIndexArr);
                    const newData = CpeeNode.parseFromJson(change.newData);

                    node.data = newData.data;
                    if(newData.attributes !== undefined) {
                        for(const [key, value] of newData.attributes) {
                            if(value === null) {
                                node.attributes.delete(key);
                            } else {
                                node.attributes.set(key, value);
                            }
                        }
                    }
                    break;
                }
                case Change.CHANGE_TYPES.DELETION: {
                    const nodeIndexArr = change.oldPath.split("/").map(str => parseInt(str));
                    const node = findNodeByIndexArr(model, nodeIndexArr);
                    node.removeFromParent();
                    break;
                }
            }
        }

        function findNodeByIndexArr(model, indexArr) {
            let currNode = model.root;
            for (let index of indexArr) {
                if (index >= currNode.numChildren()) {
                    throw new Error("Edit script not applicable to model");
                }
                currNode = currNode.getChild(index);
            }
            return currNode;
        }
    }
}

exports.Patcher = Patcher;