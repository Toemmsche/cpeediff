/*
    Copyright 2021 Tom Papke

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a root of the License at

       http=//www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

const vkbeautify = require("vkbeautify");
const xmldom = require("xmldom");
const {CpeeNode} = require("./CpeeNode");
const {Dsl} = require("../Dsl");

//TODO extend DeltaNode
class  MergeNode extends CpeeNode {

    //merge related information
    changeType;
    updates;
    changeOrigin;

    constructor(label) {
        super(label);
        this.changeType = "NIL";
        this.updates = new Map();
        this.changeOrigin = -1;
    }
    
    static fromDeltaNode(node, includeChildNodes = true) {
        const root = new MergeNode(node.label);
        root.data = node.data;
        root.changeType = node.changeType;
        for (const [key, value] of node.attributes) {
            root.attributes.set(key, value);
        }
        for (const [key, change] of node.updates) {
            root.updates.set(key, change.slice());
        }
        if (includeChildNodes) {
            for (const child of node) {
                root.appendChild(this.fromDeltaNode(child, true))
            }
        }
        return root;
    }

    isUpdate() {
        return this.updates.size > 0;
    }

    isMove() {
        return this.changeType === Dsl.CHANGE_TYPES.MOVE_TO;
    }

    isDeletion() {
        return this.changeType === Dsl.CHANGE_TYPES.DELETION || this.changeType === Dsl.CHANGE_TYPES.SUBTREE_DELETION;
    }

    isInsertion() {
        return this.changeType === Dsl.CHANGE_TYPES.INSERTION || this.changeType === Dsl.CHANGE_TYPES.SUBTREE_INSERTION;
    }

    isNil() {
        return this.changeType === Dsl.CHANGE_TYPES.NIL;
    }

    toString() {
        let res = this.label;
        res += " <" + this.changeOrigin + "_" + this.changeType + (this.isUpdate() ? "-UPD" : "") + (this.moveIndex !== null ? "_" + this.moveIndex : "") + ">";
        if (this.isUpdate()) {
            for (const [key, change]  of this.updates) {
                res += " " + key + ": [" + change[0] + "] -> [" + change[1] + "]";
            }
        }
        return res;
    }

    copy(includeChildNodes = true) {
        const copy = new  MergeNode(this.label);
        copy.data = this.data;
        copy.changeType = this.changeType;
        copy.changeOrigin = this.changeOrigin;

        for (const [key, change] of this.updates) {
            copy.updates.set(key, change.slice());
        }
        for (const [key, value] of this.attributes) {
            copy.attributes.set(key, value);
        }
        if (includeChildNodes) {
            for (const placeholder of this.placeholders) {
                copy.placeholders.push(placeholder.copy(true));
            }
            for (const child of this) {
                copy.appendChild(child.copy(true))
            }
        }
        return copy;
    }

    convertToXml( xmlDom = false, includeChildNodes = true) {
        const doc = xmldom.DOMImplementation.prototype.createDocument(Dsl.NAMESPACES.DEFAULT_NAMESPACE_URI);
        const root = constructRecursive(this);

        if (xmlDom) {
            return root;
        } else {
            doc.insertBefore(root, null);
            return vkbeautify.xml(new xmldom.XMLSerializer().serializeToString(doc));
        }

        function constructRecursive(mergeNode) {
            const changeType = mergeNode.changeType;

            const prefix = Dsl.NAMESPACES[changeType + "_NAMESPACE_PREFIX"] + ":"
            const node = doc.createElement(prefix + mergeNode.label);
            node.localName = mergeNode.label;

            //TODO delta variables
            if (mergeNode.label === Dsl.KEYWORDS.ROOT) {
                node.setAttribute("xmlns", Dsl.NAMESPACES.DEFAULT_NAMESPACE_URI);
                node.setAttribute("xmlns:" + Dsl.NAMESPACES.NIL_NAMESPACE_PREFIX, Dsl.NAMESPACES.NIL_NAMESPACE_URI);
                node.setAttribute("xmlns:" + Dsl.NAMESPACES.INSERT_NAMESPACE_PREFIX, Dsl.NAMESPACES.INSERT_NAMESPACE_URI);
                node.setAttribute("xmlns:" + Dsl.NAMESPACES.DELETE_NAMESPACE_PREFIX, Dsl.NAMESPACES.DELETE_NAMESPACE_URI);
                node.setAttribute("xmlns:" + Dsl.NAMESPACES.MOVE_FROM_NAMESPACE_PREFIX, Dsl.NAMESPACES.MOVE_FROM_NAMESPACE_URI);
                node.setAttribute("xmlns:" + Dsl.NAMESPACES.MOVE_TO_NAMESPACE_PREFIX, Dsl.NAMESPACES.MOVE_TO_NAMESPACE_URI);
                node.setAttribute("xmlns:" + Dsl.NAMESPACES.UPDATE_NAMESPACE_PREFIX, Dsl.NAMESPACES.UPDATE_NAMESPACE_URI);
            }


            //set namespace of updated fields
            for(const [key, change] of mergeNode.updates) {
                const oldVal = change[0];
                const newVal = change[1];
                if(key === "data") {
                    mergeNode.attributes.set(Dsl.NAMESPACES.UPDATE_NAMESPACE_PREFIX + ":data", "true");
                } else {
                    if(oldVal == null) {
                        const val = mergeNode.attributes.get(key);
                        mergeNode.attributes.set(Dsl.NAMESPACES.INSERT_NAMESPACE_PREFIX + ":" + key, val );
                        mergeNode.attributes.delete(key);
                    } else if(newVal == null) {
                        mergeNode.attributes.set(Dsl.NAMESPACES.DELETE_NAMESPACE_PREFIX + ":" + key, oldVal);
                    } else {
                        const val = mergeNode.attributes.get(key);
                        mergeNode.attributes.set(Dsl.NAMESPACES.UPDATE_NAMESPACE_PREFIX + ":" + key, val);
                        mergeNode.attributes.delete(key);
                    }
                }
            }

            for (const [key, value] of mergeNode.attributes) {

                node.setAttribute(key, value);
            }

            if (includeChildNodes) {
                for (const child of mergeNode) {
                    node.appendChild(constructRecursive(child));
                }
            }

            if (mergeNode.data != null) {
                node.appendChild(doc.createTextNode(mergeNode.data))
            }

            return node;
        }
    }

}

exports. MergeNode =  MergeNode;