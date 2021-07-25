//TODO features
//      compare path with weights depending on closeness
//      dynamic weights for comparison
//      command line visualization including "live" patching and filtered changes
//      data passses in parallel branches
//      use _assign() to make copies
//      critical after parallel? -> ask Juergen
//      option to output matching
//      use labelmap inside pathmatching
//      use label-endpoint map for similarity matching (as option)
//      unmatched matcher
//      TRY NEW BOTTOM BUILD UP N" MAP COMMONAIL:TY ALGO

//TODO gen
//      trees are still too small because of preprocessor, check that out

//TODO semi-features
//      maybe collapse call comparison values ionto single equation
//      annotated merged tree output (with conrfidence)
//      trim all strings of whitespaces and stuff (e.g. attribute values) ==> also test case
//      CHANGE origin in xml
//      command line interface (help, error messages, logging, etc.)
//      option to turn of preprocessing like removing description nodes or empty control flow structures
//      colors in delta output

//TODO tidy
//      use ? operator wherever possible and sinnvoll
//      hide private properties everywhere
//      model type in geneartor params
//      use arrow notation (or dont use private function)
//      IMPORTANT: maybe mark clearly which nodes belong to which tree, e.g. oldNode, deltaNode, etc. just more meaningful variable names
//      Add documentation to _important_ local variables (eg DP array)
//      use xpath like syntax
//      shorten some names (variables -> vars e..g)
//      resolve naming conflicts (call as argunment)
//      use simultenous init syntax ( [var1, var2,..] = ) wherever necessary

//TODO bugs+
//      fix move_to
//      fix deltatree gen
//      upodates are not detected at large
//      test conversion to XML
//      namespaces
//      add null checks for appropriate methods
//      edit script not applicable
//      robustness against indentation and newlines/whitespaces
//      unnecessary tree traversals during matching, edit script genreation, and merging
//      make robust against missing root
//      robust against keywrods as properties
//      differtnt merge output trees (dt1 and dt2)
//      multiple otherwise (or alternatives with same condition) --> matchSimilarUnmatched top down()
//      merge produces a lot of wrong merges (e.g. disregards semantic properties)
//          update_conflict with differnt endpoint and argument list
//          deletion of node taht declared a variable (maybe not)

//TODO REWRITE
//      Turn autogenearted tests into class
//      use the change types and keywords objects instead of strings
//      delete includes deleted tree
//      implement hash yourself
//      use underscores
//      add some patterns
//      type and test coverage similar to markdwon-tables

//TODO advanced semantics
//     if parallel_branch matched, match paralell (same for choose and otherwise/alternative)

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
