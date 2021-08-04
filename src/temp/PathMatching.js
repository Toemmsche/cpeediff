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

const {StandardComparator} = require("../match/compare/StandardComparator");
const {Lcs} = require("../lib/Lcs");
const {Config} = require("../Config");
const {AbstractMatchingAlgorithm} = require("../match/AbstractMatchingAlgorithm");
const {Matching} = require("../match/Matching");
const {CpeeTree} = require("../tree/CpeeTree");


export class PathMatching extends AbstractMatchingAlgorithm {

    /**
     * Matches nodes in the two process trees according to the matching algorithm
     * described by
     * Kyong-Ho et al., "An Efficient Algorithm to Compute Differences between Structured Documents", 2004
     * @param {CpeeTree} oldTree The old process tree
     * @param {CpeeTree} newTree The new process tree
     * @param matching
     * @param comparator
     *                                    The order the matching algorithms are applied in matters.
     * @return {Matching} A matching containing a mapping of nodes from oldTree to newTree
     */
    static match(oldTree, newTree, matching = new Matching(), comparator = new StandardComparator()) {
        //get all nodes, leaf nodes and inner nodes of the trees
        const oldLeaves = oldTree.leaves()();
        const newLeaves = newTree.leaves()();

        /*
        Step 1: Match leaf nodes.
        */

        let start = new Date().getTime();

        //Use buckets for each label
        const newLabelMap = new Map();
        const oldLabelMap = new Map();
        for (const newLeaf of newLeaves) {
            if (!newLabelMap.has(newLeaf.label)) {
                newLabelMap.set(newLeaf.label, []);
            }
            newLabelMap.get(newLeaf.label).push(newLeaf);
        }
        for (const oldLeaf of oldLeaves) {
            if (!oldLabelMap.has(oldLeaf.label)) {
                oldLabelMap.set(oldLeaf.label, []);
            }
            oldLabelMap.get(oldLeaf.label).push(oldLeaf);
        }
        const oldToNewLeafMap = new Map();
        for (const [label, newNodeList] of newLabelMap) {
            if (oldLabelMap.has(label)) {
                for (const newLeaf of newNodeList) {
                    //the minimum compare value
                    let minCompareValue = 1;
                    let minCompareNode = null;
                    for (const oldLeaf of oldLabelMap.get(label)) {
                        const compareValue = comparator.compare(newLeaf, oldLeaf);
                        let longestLCS = -1;
                        if (compareValue < minCompareValue) {
                            minCompareValue = compareValue;
                            // longestLCS = Lcs.getLCS(oldLeaf.path, newLeaf.path, (a,b) => a.label === b.label);
                            //Discard all matching with a higher comparison value
                            minCompareNode = oldLeaf;
                        }
                    }
                    if (minCompareValue < Config.COMPARISON_THRESHOLD) {
                        if (!oldToNewLeafMap.has(minCompareNode)) {
                            oldToNewLeafMap.set(minCompareNode, []);
                        }
                        oldToNewLeafMap.get(minCompareNode).push([newLeaf, minCompareValue]);
                    }
                }
            }
        }

        for (const [oldLeaf, newMatches] of oldToNewLeafMap) {
            let min = null;
            for (const tuple of newMatches) {
                if (min == null || tuple[1] < min[1]) {
                    min = tuple;
                }
            }
            matching.matchNew(min[0], oldLeaf);
        }

        let end = new Date().getTime();
        console.log("matching leaves took " + (end - start) + "ms");
        console.log("leaves matched: " + matching.newToOldMap.size);

        /*
        Step 3: Match inner nodes.
         */
        start = new Date().getTime();

        //Every pair of matched leaf nodes induces a comparison of the respective node paths from root to parent
        //to find potential matches.

        const newInnersMap = new Map();
        for (const [newLeaf, oldLeaf] of matching) {
            matchPathExperimental(oldLeaf, newLeaf);
        }

        end = new Date().getTime();

        console.log("matching paths took " + (end - start) + "ms");

        //running time hypothesis: O(n)
        function matchPath(oldLeaf, newLeaf) {
            //copy paths, reverse them and remove first element
            const newPath = newLeaf.path.slice().reverse().slice(1);
            const oldPath = oldLeaf.path.slice().reverse().slice(1);

            //index in newPath where last matching occurred
            let j = 0;
            for (let i = 0; i < oldPath.length; i++) {
                for (let k = j; k < newPath.length; k++) {
                    //does there already exist a match between the two paths?
                    if (matching.hasNew(newPath[k]) && oldPath.includes(matching.getNew(newPath[k]))) {
                        //If so, we terminate to preserve ancestor order within the path
                        return;
                    } else if (comparator.compare(newPath[k], oldPath[i]) < Config.COMPARISON_THRESHOLD) {
                        matching.matchNew(newPath[k], oldPath[i]);
                        //update last matching index to avoid a false positive of the first if branch in subsequent iterations
                        j = k + 1;
                        break;
                    }
                }
            }
        }


        /*
        Potential new matching approach:
        Hash leaf nodes using a number hash (exclude empty nodes like terminat eor stop or escape)
        apply hash matching like in RWS Diff
        compare remaining leaf nodes with comparator()
        match inner nodes with equal hash()

        group inner nodes by label-buckets
        compare using content and sets (or lists) of contained hashes and path to root (only heuristically)

        worst case: O(n²)

        round off with top-down matching and matchSimilarUnmatched()

        additional considerations:
        large subtree matchings (same hash) could force path matching (threshold?)
         */

        //hypothesis: O(n²)
        function matchPathExperimental(oldLeaf, newLeaf) {
            //copy paths, reverse them and remove first element
            const newPath = newLeaf.path.slice().reverse().slice(1);
            const oldPath = oldLeaf.path.slice().reverse().slice(1);

            const lcs = Lcs.getLCS(newPath, oldPath, (a, b) => a.label === b.label, true);

            const newLcs = lcs.get(0);
            const oldLcs = lcs.get(1);

            //index in newPath where last matching occurred
            for (let i = 0; i < newLcs.length; i++) {
                if (comparator.compare(newLcs[i], oldLcs[i]) <= Config.COMPARISON_THRESHOLD && !(matching.hasNew(newLcs[i] && oldPath.includes(matching.getNew(newLcs[i]))))) {
                    matching.matchNew(newLcs[i], oldLcs[i]);
                }
            }
        }

        //always match root and initializer script
        matching.matchNew(newTree, oldTree);
        matching.matchNew(newTree.getChild(0), oldTree.getChild(0));


        start = new Date().getTime();
        //match properties of leaf nodes
        for (const newLeaf of newLeaves) {
            if (matching.hasNew(newLeaf)) {
                matchProperties(newLeaf, matching.getNew(newLeaf));
            }
        }
        end = new Date().getTime();
        console.log("matching properties took " + (end - start) + "ms");

        function matchProperties(newNode, oldNode) {
            //We assume that no two properties that are siblings in the xml tree share the same label
            const oldLabelMap = new Map();
            for (const oldChild of oldNode) {
                oldLabelMap.set(oldChild.label, oldChild);
            }
            for (const newChild of newNode) {
                if (oldLabelMap.has(newChild.label)) {
                    const match = oldLabelMap.get(newChild.label);
                    matching.matchNew(newChild, match);
                    matchProperties(newChild, match);
                }
            }
        }

        //TODO matchSimilarUnmatched()
        matching._propagate();

        return matching;
    }
}

