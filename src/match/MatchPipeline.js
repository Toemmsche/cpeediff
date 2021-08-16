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
import {Logger} from "../../util/Logger.js";
import {Config} from "../Config.js";
import {CommonalityPathMatcher} from "./CommonalityPathMatcher.js";
import {FastSimilarityMatcher} from "./FastSimilarityMatcher.js";
import {PathMatcher} from "./PathMatcher.js";
import {HungSimMatcher} from "./HungSimMatcher.js";


export class MatchPipeline {

    matchers;

    constructor(matchers) {
        const len = matchers.length;
        //FixedMatcher is always the first matching algorithm in the pipeline
        if (len === 0 || matchers[0].constructor !== FixedMatcher) {
            matchers.unshift(new FixedMatcher());
        }
        //PropertyMatcher is always the last matching algorithm in the pipeline
        if (len === 0 || matchers[len - 1].constructor !== PropertyMatcher) {
            matchers.push(new PropertyMatcher());
        }
        this.matchers = matchers;
    }

    static fromMode() {
        switch (Config.MATCH_MODE) {
            case Config.MATCH_MODES.FAST:
                Config.EXP = false;
                return new MatchPipeline([new FixedMatcher(), new HashMatcher(), new HungSimMatcher(), new CommonalityPathMatcher(), new PathMatcher(), new UnmatchedMatcher(), new PropertyMatcher()]);
            case Config.MATCH_MODES.BALANCED:
                Config.EXP =  true;
                return new MatchPipeline([new FixedMatcher(), new HashMatcher(), new SimilarityMatcher(), new PathMatcher(), new PathMatcher(), new UnmatchedMatcher(), new PropertyMatcher()]);
            case Config.MATCH_MODES.QUALITY:
                Config.EXP = false;
                return new MatchPipeline([new FixedMatcher(), new HashMatcher(), new SimilarityMatcher(), new CommonalityPathMatcher(), new PathMatcher(), new UnmatchedMatcher(), new PropertyMatcher()]);
        }
    }

    static forMerge() {
        //no unmatched matcher
        return new MatchPipeline([new FixedMatcher(), new HashMatcher(), new SimilarityMatcher(), new CommonalityPathMatcher(), new PathMatcher(), new PropertyMatcher()]);
    }

    /*
    TO BEAT for benchmark
    6781 376 >-----
    | CpeeDiff_quality  | 4840    | 6786    | 61352     | 393           | 72         | 98      | 79      | 144       |
| CpeeDiff_balanced | 4703    | 6805    | 62975     | 425           | 73         | 114     | 78      | 160       |
| CpeeDiff_fast     | 4769    | 6805    | 62975     | 425           | 73         | 114     | 78      | 160       |

     */

    execute(oldTree, newTree, comparator = new StandardComparator(), matching = new Matching()) {
        for (const matcher of this.matchers) {
            Logger.info("Running matching module " + matcher.constructor.name + "...", this);
            Logger.startTimed();
            const prevMatches = matching.size();
            matcher.match(oldTree, newTree, matching, comparator);
            Logger.stat("Matching module " + matcher.constructor.name + " took " + Logger.endTimed()
                + "ms and found " + (matching.size() - prevMatches) + " matches", this);
        }
        return matching;
    }

}

