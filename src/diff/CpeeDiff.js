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


import {StandardComparator} from "../match/compare/StandardComparator.js";
import {EditScriptGenerator} from "./delta/EditScriptGenerator.js";
import {NodeFactory} from "../tree/NodeFactory.js";
import {MatchPipeline} from "../match/MatchPipeline.js";

export class CpeeDiff {
    
    matchPipeline;
    editScriptGenerator;
    
    constructor(matchPipeline = MatchPipeline.standard()) {
        this.matchPipeline = matchPipeline;
        this.editScriptGenerator = new EditScriptGenerator();
    }

    diff(oldTree, newTree, comparator = new StandardComparator()) {
        //this will modify the old tree, hence a copy is used
        const oldTreeCopy = NodeFactory.getNode(oldTree);
        const matching = this.matchPipeline.execute(oldTreeCopy, newTree, comparator);
        //generate edit script
        return this.editScriptGenerator.generateEditScript(oldTreeCopy, newTree, matching);
    }
}