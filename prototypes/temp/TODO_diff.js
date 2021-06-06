//TODO features
//      longest substring compare for scripts
//      export set and map similarity calculation
//      add consistency check for data dependencies (variables are declared as data elements (all?)
//      IMPORTANT make exact edit script toggleable
//      add reshuffling in merger
//      patch context
//      leaf matching: Find easy matches using buckets grouped by label, then match leftover nodes
//      IMPORTANT: compare path
//      comparisons for remaining inner nodes
//      fix model generator and implement change agent
//      smart index search to avoid reshuffling
//      IMPORTANT rewrite placeholder not as parent attribute

//TODO new algos
//      q-gram distance for script comparison
//      fast match by Chawathe et al.
//      Simple match by Chawathe et al.
//      optimize matching
//      IMPORTANT matchSimilarUnmatched() by 3DM (optimize topdown matching)

//TODO maybe features
//      conflict groups for reshuffling (toggleable)

//TODO semi-features
//      use custom class for attributes (maybe extension of map)
//      patcher supports child index only and type index
//      output path instead of attributes
//      add verbose function
//      command line interface (help, error messages, logging, etc.)
//      use global variable for options
//      option to turn of preprocessing like removing description nodes or empty control flow structures
//      IMPORTANT use default parameters to simplify postorder methods etc.
//      diff method is static
//      pretty output vs machine readable (JSON vs treestring)
//      readVariables considers Code, too
//      read and modified Variables as Getter???


//TODO tidy
//      replace nodeequals with === where applicable
//      encapsulate handleInsert() in edit script generation
//      use arrow notation (or dont use private function)
//      IMPORTANT: maybe mark clearly which nodes belong to which tree, e.g. oldNode, deltaNode, etc. just more meaningful variable names
//      Add documentation to _important_ local variables (eg DP array)
//      fix parallel
//      replace label comparison with instanceof
//      use multiple inheritance for call otherwise etc.
//      find cleaner way to get node attributes (e.g. is property node)
//      use scientific names for variables (elementIndex instead of type index (XPATH),
//      use xpath like syntax
//      maybe change member variable declaration and initiliazation
//      use constructor for node comparison
//      move node boolean flags into cpeemodel to keep semantic parsing in one place
//      rename root to node in model
//      all numerical constants in a config file (goes against stateless idea)
//      shorten some names (variables -> vars e..g)
//      change TNode name (maybe element or text)
//      automate namespaces and changetype attributes
//      resolve naming conflicts (call as argunment)
//      use simultenous init syntax ( [var1, var2,..] = ) wherever possible


//TODO REWRITE
//      use underscores
//      all constants (even attribute id strings into config, maybe split into config and DSL);
//      property-subtree
//      MatchedNode subclass instead of matching class (with maxSimilarity, etc)
//      VIZ only;
//          fix property trees in inner nodes (.properties() method)
//          find a way around childattributes (property extractor) or clean up deletion in pathmatching
//         make subclass for property nodes
//          minimum edit script doesnt feautre old data
//          dual namespaces maybe with update namespace for changed attributes/data

/*
Merge Ideas:
2way: Find conflicts between unmatched nodes
Examine move and update operations

3way: rely on edit script (+ dependency and consistency information), not matching (diff is result of your tool)
build diff between 1 and 2, merge automatically where only one choice consistent, If two choices (without future side effects),
merge automatically
either get deleted nodes at the start or proceed in edit script order.

Force context preservation (adjustable)

Merge edit script between base and T1 into T2 using merge algorithm
 */
