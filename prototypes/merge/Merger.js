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
const {UnifiedEditScript, UnifiedChange} = require("../editscript/UnifiedEditScript");

class Merger {

    static merge(model, changes) {
        for(const change of changes) {
            //look for target node
            switch (change.changeType) {
                case UnifiedChange.TYPE_ENUM.INSERTION:
                    if(this.findNode(model, change.targetPath, change.targetPayload) === null) {
                        console.log("Couldn't find node " + change.targetPayload.label);
                    }
                    break;
                case UnifiedChange.TYPE_ENUM.DELETION:
                    if(this.findNode(model, change.sourcePath, change.sourcePayload) === null) {
                        console.log("Couldn't find node " + change.sourcePayload.label);
                    }
                    break;
                case UnifiedChange.TYPE_ENUM.MOVE:
                    if(this.findNode(model, change.sourcePath, change.sourcePayload) === null) {
                        console.log("Couldn't find node " + change.sourcePayload.label);
                    }
                    if(this.findNode(model, change.targetPath, change.targetPayload) === null) {
                        console.log("Couldn't find node " + change.targetPayload.label);
                    }
                    break;
                case UnifiedChange.TYPE_ENUM.RELABEL:
                    if(this.findNode(model, change.sourcePath, change.sourcePayload) === null) {
                        console.log("Couldn't find node " + change.sourcePayload.label);
                    }
                    break;
                case UnifiedChange.TYPE_ENUM.COPY:
                    if(this.findNode(model, change.sourcePath, change.sourcePayload) === null) {
                        console.log("Couldn't find node " + change.sourcePayload.label);
                    }
                    break;
                case UnifiedChange.TYPE_ENUM.SUBTREE_INSERTION:
                    if(this.findNode(model, change.sourcePath, change.sourcePayload) === null) {
                        console.log("Couldn't find node " + change.sourcePayload.label);
                    }
                    break;
                case UnifiedChange.TYPE_ENUM.SUBTREE_DELETION:
                    if(this.findNode(model, change.targetPath, change.targetPayload) === null) {
                        console.log("Couldn't find node " + change.targetPayload.label);
                    }
                    break;
                case UnifiedChange.TYPE_ENUM.RESHUFFLE:
                    if(this.findNode(model, change.targetPath, change.targetPayload) === null) {
                        console.log("Couldn't find node " + change.targetPayload.label);
                    }
                    break;
                default:
                    break;
            }
        }
    }

    //requirements: label path has to match fully. comparison value should be very low.
    static findNode(model, path, node) {
        path = path.substring(1, path.length - 1);
        const labelsWithIndex = path.split("/").map( s => {
            const arr = s.split("[");
            return {
                label: arr[0],
                typeIndex: parseInt(arr[1].substring(0, arr[1].length - 1))
            }
        });
        let currNode = model.root;
        labels: for(const labelWithIndex of labelsWithIndex.slice(1)) { //exclude description node
            let typeCounter  = 0;
            for(const childNode of currNode.childNodes) {
                if(childNode.label === labelWithIndex.label) {
                    if(typeCounter === labelWithIndex.typeIndex) {
                        currNode = childNode;
                        continue labels;
                    }
                    typeCounter++;
                }
            }

            //TODO only return false if strict merging mode is enabled
            return null;
        }
        return currNode;
    }
}

exports.Merger = Merger;
