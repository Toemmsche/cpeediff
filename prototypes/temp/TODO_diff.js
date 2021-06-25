//TODO features
//      weights during inner node matching, fully matched code induces matching
//      IMPORTANT make exact edit script toggleable
//      compare path with weights depending on closeness
//      implement change agent
//      command line visualization including "live" patching and filtered changes
//      configurable separator between data and variable name (make "data." configurable)
//      hash only considers semantic aspects
//      data passses in parallel branches

//TODO gen
//      models are still too small because of preprocessor, check that out

//TODO new algos
//      fast LIS (O nlogn)
//      q-gram distance for string comparison and similarity
//      optimize matching
//      IMPORTANT matchSimilarUnmatched() by 3DM (optimize topdown matching)

//TODO maybe features
//      conflict groups for reshuffling (toggleable)
//      model validator
//      append updates even in the case of insertion

//TODO semi-features
//      call arguments sensitive to ordering ?
//      CHANGE origin in xml
//      chnage origin for ujpdates -->> own object ( with undefined meaning not present -> insertion or deletion)
//      ignore comments during xml parsing
//      command line interface (help, error messages, logging, etc.)
//      use global variable for options
//      option to turn of preprocessing like removing description nodes or empty control flow structures
//      IMPORTANT use default parameters to simplify postorder methods etc.
//      readVariables considers Code, too
//      colors in delta output

//TODO tidy
//      rename model to tree (thesis title is prroces tree diff aferter all)
//      use custom objects as return values (e.g. change in updates)
//      make insertChild() call removeFromparent(),
//      no static methods
//      use arrow notation (or dont use private function)
//      IMPORTANT: maybe mark clearly which nodes belong to which tree, e.g. oldNode, deltaNode, etc. just more meaningful variable names
//      Add documentation to _important_ local variables (eg DP array)
//      use scientific names for variables (elementIndex instead of type index (XPATH),
//      use xpath like syntax
//      all numerical constants in a config file (goes against stateless idea)
//      shorten some names (variables -> vars e..g)
//      change TNode name (maybe element or text)
//      resolve naming conflicts (call as argunment)
//      use simultenous init syntax ( [var1, var2,..] = ) wherever possible
//      no construction paramters for comparator and matching


//TODO bugs
//      robustness against indentation and newlines/whitespaces
//      unnecessary tree traversals during matching, edit script genreation, and merging
//      make robust against missing root
//      robust against keywrods as properties
//      differtnt merge output trees (dt1 and dt2)
//      missing method, label, code and args, endpoint
//      multiple otherwise (or alternatives with same condition) --> matchSimilarUnmatched top down()
//      merge produces a lot of wrong merges (e.g. disregards semantic properties)
//          update_conflict with differnt endpoint and argument list
//          deletion of node taht declared a variable (maybe not)

//TODO REWRITE
//      comparator and matching as config variables
//      if model doesnt have own attributes, -> remove and replace with root, rename cpeemodel to tree, rename cpeenode to basenode
//      implement hash yourself
//      make propertyExtractor reutrn an object with fields instead of map
//      update class
//      deltaTree is result of editScriptFActory
//      use underscores
//      all constants (even attribute id strings into config, maybe split into config and DSL);
//      property-subtree
//      MatchedNode subclass instead of matching class (with maxSimilarity, etc)
//      add some patterns

//TODO advanced semantics
//     if parallel_branch matched, match paralell (same for choose and otherwise/alternative)
/*
Merge Ideas:


3way:
idea 1: Use mapping between DeltaTree (without move_from) for T1 and T2 to produce a merged tree (DeltaMerger)

idea 2: Merge the set of leaf nodes, then
 */

/*
pipeline

Parser -> preprocessor -> validator (for old and new model --> warnings and forbidden moves) -> match -> editScript -> deltaTree -> merge
 */

/*
Problems with examined matching algorithms:
Chawathe - Match & Fastmatch: Acyclicity condition is not satisfied
Kyong Ho lee - PathMatch: Scenarios with single inserts yield unfavourable matching results
RWS-Diff: complex implementation of index structures. Performance is not the focus -> O(n²) is acceptable

Tekli et al.: Move operation is not considered
XCC: parent match condition -> not suitable for operation focused edit scripts
Cobena - XyDiff: Perofmrance is not an issue -> subtree hashing is sensitive to small changes.
brazil - Similarity matching: Too expensive, hungarian algorithm is O(n³)
wang K-Diff+: No move operation, weird matchin

3dm: doesnt consider semantics, may produce syntactically wrong matches (because of copies)
mohald: Requires UIDs, doesn't support arbitrary XML (not ours)
 */
