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


import {FixedMatcher} from "./FixedMatcher.js";
import {PropertyMatcher} from "./PropertyMatcher.js";
import {Matching} from "./Matching.js";
import {StandardComparator} from "./StandardComparator.js";
import {HashMatcher} from "./HashMatcher.js";
import {SimilarityMatcher} from "./SimilarityMatcher.js";
import {UnmatchedMatcher} from "./UnmatchedMatcher.js";
import {UnmatchedMatcher2} from "./UnmatchedMatcher2.js";
import {PathMatcher} from "./PathMatcher.js";
import {Logger} from "../../util/Logger.js";
import {PathMatcher_old} from "./PathMatcher_old.js";

export class MatchPipeline {

    matchers;
    
    constructor(matchers) {
        const len = matchers.length;
        //FixedMatcher is always the first matching algorithm in the pipeline
        if(len === 0 || matchers[0].constructor !== FixedMatcher) {
            matchers.unshift(new FixedMatcher());
        }
        //PropertyMatcher is always the last matching algorithm in the pipeline
        if(len === 0 || matchers[len - 1].constructor !== PropertyMatcher) {
            matchers.push(new PropertyMatcher());
        }
        this.matchers = matchers;
    }
    
    execute(oldTree, newTree, comparator = new StandardComparator(), matching = new Matching()) {
        for(const matcher of this.matchers) {
            Logger.info("Running matching module " + matcher.constructor.name + "...", this);
            Logger.startTimed();
            const prevMatches = matching.size();
            matcher.match(oldTree, newTree, matching, comparator);
            Logger.stat("Matching module " + matcher.constructor.name + " took " + Logger.endTimed()
                + "ms and found " + (matching.size() - prevMatches) + " matches", this);
        }
        return matching;
    }

    static standard() {
        //PathMatcher is executed twice to capture missed matches
        return new MatchPipeline([new FixedMatcher(), new HashMatcher(), new SimilarityMatcher(), new PathMatcher(), new PathMatcher(), new PropertyMatcher()]);
    }

}

