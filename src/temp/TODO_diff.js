//TODO features
//      compare path with weights depending on closeness
//      command line visualization including "live" patching and filtered changes
//      data passses in parallel branches
//      use _assign() to make copies
//      remove <newcontent> from xml delta
//      put to post and patch comparison
//      critical after parallel? -> ask Juergen

//TODO gen
//      trees are still too small because of preprocessor, check that out

//TODO new algos
//      q-gram distance for string comparison and similarity
//      IMPORTANT matchSimilarUnmatched() by 3DM (optimize topdown matching)

//TODO maybe features
//      lis with custom comparator (why?)
//      conflict groups for reshuffling (toggleable)

//TODO semi-features
//      annotated merged tree output (with conrfidence)
//      weigh call args and read code variables differently
//      trim all strings of whitespaces and stuff (e.g. attribute values) ==> also test case
//      call arguments sensitive to ordering ?
//      CHANGE origin in xml
//      ignore comments during xml parsing
//      command line interface (help, error messages, logging, etc.)
//      option to turn of preprocessing like removing description nodes or empty control flow structures
//      colors in delta output

//TODO tidy
//      rename keywords to elements
//      hide private properties everywhere
//      model type in geneartor params
//      use arrow notation (or dont use private function)
//      IMPORTANT: maybe mark clearly which nodes belong to which tree, e.g. oldNode, deltaNode, etc. just more meaningful variable names
//      Add documentation to _important_ local variables (eg DP array)
//      use scientific names for variables (elementIndex instead of type index (XPATH),
//      use xpath like syntax
//      all numerical constants in a config file (goes against stateless idea)
//      shorten some names (variables -> vars e..g)
//      resolve naming conflicts (call as argunment)
//      use simultenous init syntax ( [var1, var2,..] = ) wherever possible
//      no construction paramters for comparator and matching


//TODO bugs+
//      test conversion to XML
//      namespaces
//      add null checks for appropriate methods
//      edit script not applicable
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
//      use the change types and keywords objects instead of strings
//      wrap diff/namespace objects in functions (NO because of configurability)
//      delete includes deleted tree
//      implement hash yourself
//      use underscores
//      all constants (even attribute id strings into config, maybe split into config and DSL);
//      add some patterns
//      type and test coverage similar to markdwon-tables

//TODO advanced semantics
//     if parallel_branch matched, match paralell (same for choose and otherwise/alternative)
/*
Merge Ideas:


3way:
idea 1: Use mapping between DeltaTree (without move_from) for T1 and T2 to produce a merged tree (CpeeMerge)

idea 2: Merge the set of leaf nodes, then
 */

/*
pipeline

Parser -> preprocessor -> validator (for old and new tree --> warnings and forbidden moves) -> match -> editScript -> deltaTree -> merge
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
