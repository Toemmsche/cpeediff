//TODO features
//      longest substring compare for scripts (or q gram distance)
//      export set and map similarity calculation
//      IMPORTANT make exact edit script toggleable
//      distinguish between interparent and far move
//      IMPORTANT: compare path (heuristically)
//      comparisons for remaining inner nodes
//      implement change agent
//      command line visualization including "live" patching and filtered changes
//      configurable separator between data and variable name (make "data." configurable)

//TODO new algos
//      fast LIS (O nlogn)
//      q-gram distance for string comparison and similarity
//      fast match by Chawathe et al.
//      optimize matching
//      IMPORTANT matchSimilarUnmatched() by 3DM (optimize topdown matching)

//TODO maybe features
//      conflict groups for reshuffling (toggleable)
//      model validator

//TODO semi-features
//      call arguments sensitive to ordering ?
//      CHANGE origin in xml
//      chnage origin for ujpdates -->> own object ( with undefined meaning not present -> insertion or deletion)
//      confidence level during merging
//      make init script toggleable
//      ignore comments during xml parsing
//      ensure one to one matching
//      command line interface (help, error messages, logging, etc.)
//      use global variable for options
//      option to turn of preprocessing like removing description nodes or empty control flow structures
//      IMPORTANT use default parameters to simplify postorder methods etc.
//      readVariables considers Code, too
//      colors in delta output

//TODO tidy
//      rename model to tree (thesis title is prroces tree diff aferter all)
//      use custom objects as return values (e.g. change in updates)
//      make property strings members of keyword objects
//      make insertChild() call removeFromparent(),
//      no static methods
//      replace nodeequals with === where applicable
//      encapsulate handleInsert() in edit script generation
//      use arrow notation (or dont use private function)
//      IMPORTANT: maybe mark clearly which nodes belong to which tree, e.g. oldNode, deltaNode, etc. just more meaningful variable names
//      Add documentation to _important_ local variables (eg DP array)
//      use scientific names for variables (elementIndex instead of type index (XPATH),
//      use xpath like syntax
//      move node boolean flags into cpeemodel to keep semantic parsing in one place
//      all numerical constants in a config file (goes against stateless idea)
//      shorten some names (variables -> vars e..g)
//      change TNode name (maybe element or text)
//      automate namespaces and changetype attributes
//      resolve naming conflicts (call as argunment)
//      use simultenous init syntax ( [var1, var2,..] = ) wherever possible
//      maybe remove contructrecursive and use actual recursion


//TODO bugs
//      robustness against indentation and newlines/whitespaces
//      unnecessary tree traversals during matching, edit script genreation, hashing and merging
//      make robust against missing root and init script
//      similar insertions are not compared in regards to update conflicts
//      are data passes (parallel branch) resolved correctly?


//TODO REWRITE
//      nodeFactory is responsible for all instanation (parseFromXml, fromCpeeNode, etc)
//      splite edit script geneartion into phases (with individual methods)
//      update class
//      merged node as subclass
//      deltaTree is result of editScriptFActory
//      use underscores
//      all constants (even attribute id strings into config, maybe split into config and DSL);
//      property-subtree
//      MatchedNode subclass instead of matching class (with maxSimilarity, etc)
//      add some patterns
//      VIZ only;
//          fix property trees in inner nodes (.properties() method)
//          find a way around childattributes (property extractor) or clean up deletion in pathmatching
//          dual namespaces maybe with update namespace for changed attributes/data

//TODO advanced semantics
//      nested chooses -> single choose (depends on CPEE spec --> look it up)
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
wang K-Diff+: No move operation, weird matching
 */
