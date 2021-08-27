//TODO features
//      option to output matching
//      turn single function classes in to functions
//      print diff info option (as format option)
//      option to output no diff
//      option for no preprocessing
//      deleted tree in edit script

//TODO semi-features
//      delta tree with old update value, baseNode, colors, etc.
//      annotated merged tree output (with conrfidence, changeorigin, etc.)
//      trim all strings of whitespaces and stuff (e.g. attribute values) ==> also test case

//TODO tidy
//    do not replace newlines (think of python)
//      unmatched nodes function()
//      change model labels
//      new node as in inserted vs new node as in from new tree
//      decide which properties are read only (e.g. placeholders) use with get() function
//      bne consistenwit .... or array
//      use ? operator wherever possible and sinnvoll
//      hide private properties everywhere
//      model type in geneartor params
//      use arrow notation (or dont use private function)
//      shorten some names (variables -> vars e..g)
//      resolve naming conflicts (call as argunment)
//      use simultenous init syntax ( [var1, var2,..] = ) wherever necessary
//      generator function
//      make data classes read only (const)

//TODO bugs+
//      fix move_to
//      test conversion to XML
//      namespaces
//      add null checks for appropriate methods
//      robustness against indentation and newlines/whitespaces
//      differtnt merge output trees (dt1 and dt2)

//TODO REWRITE
//      use multi array in weighted averager
//      no try catch in treegen
//      split up into finalize/update/etc. comparison


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
