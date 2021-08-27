//TODO features
//      command line visualization including "live" patching and filtered changes
//      option to output matching
//      turn single function classes in to functions
//      add timings to merger
//      print diff info option
//      option to output no diff
//      perfect match shortcut in matchers
//    add raw mode that also considers preprocessor changes
//    deleted tree in edit script

//TODO gen
//      trees are still too small because of preprocessor, check that out

//TODO semi-features
//      delta tree with old update value
//      maybe collapse call comparison values ionto single equation
//      annotated merged tree output (with conrfidence)
//      trim all strings of whitespaces and stuff (e.g. attribute values) ==> also test case
//      CHANGE origin in xml
//      command line interface (help, error messages, logging, etc.)
//      option to turn of preprocessing like removing description nodes or empty control flow structures
//      colors in delta output

//TODO tidy
//    do not replace newlines (think of python)
//      unmatched nodes function()
//      change model labels
//      reintroduce copy() and static from().
//      use lowercase and Array<Node> in documentation
//      use setAttributeNS of xmldom (doesnt work as intended)
//      new node as in inserted vs new node as in from new tree
//      decide which properties are read only (e.g. placeholders) use with get() function
//      bne consistenwit .... or array
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
//      generator function
//      make data classes read only

//TODO bugs+
//      fix move_to
//      fix deltatree gen
//      test conversion to XML
//      namespaces
//      add null checks for appropriate methods
//      robustness against indentation and newlines/whitespaces
//      differtnt merge output trees (dt1 and dt2)
//      merge produces a lot of wrong merges (e.g. disregards semantic properties)
//          update_conflict with differnt endpoint and argument list
//          deletion of node taht declared a variable (maybe not)

//TODO REWRITE
//      use id for mapping and matching
//      Turn autogenearted tests into class
//      delete includes deleted tree
//      use multi array in weighted averager
//      no try catch in treegen


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
