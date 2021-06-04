//TODO features
//      longest substring compare for scripts
//      IMPROTANT path string separate method
//      export set and map similarity calculation
//      add consistency check for data dependencies (variables are declared as data elements (all?)
//      conflict groups for reshuffling (toggleable)
//      IMPORTANT make exact edit script toggleable
//      add reshuffling in merger
//      delta Tree with placeholders for move
//      consistency check involving variables (e.g. condition variable is modified in loop), stops, criticals, loops
//      patch context
//      ?? make data path ./
//      use name spaces for delta tree conversion to XML
//      leaf matching: Find easy matches using hashing (or buckets grouped by label), then match leftover nodes
//      IMPORTANT: compare path

//TODO new algos
//      q-gram distance for script comparison
//      fast match by Chawathe et al.
//      Simple match by Chawathe et al.
//      optimize matching
//      matchSimilarUnmatched() by 3DM (optimize topdown matching)

//TODO semi-features
//      differentiate between printing string and internal string
//      mapping between declared variables
//      use custom class for attributes (maybe extension of map)
//      patcher supports child index only and type index
//      output path instead of attributes
//      add verbose function
//      command line interface (help, error messages, logging, etc.)
//      use global variable for options
//      option to turn of preprocessing like removing description nodes or empty control flow structures
//      use path as key in call comparison
//      convert cpeemodel back to XML
//      IMPORTANT use default parameters to simplify postorder methods etc.
//      use inner no0de matching to match leaf nodes in similar trees even when they're slightly different
//      diff method is static
//      make parseFromJSON return properly typed and instantiated (parent and path) object
//      pretty output vs machine readable (JSON vs treestring)
//      readVariables considers Code, too
//      read and modified Variables as Getter???
//      convert property nodes in delta tree generator


//TODO tidy
//      replace nodeequals with === where applicable
//      encapsulate handleInsert() in edit script generation
//      diff() performes conversion to CpeeModel
//      use arrow notation (or dont use private function)
//      turn path into method
//      maybe mark clearly which nodes belong to which tree
//      Deicision options in diff or class
//      Add documentation to _important_ local variables (eg DP array)
//      find a way to copy gracefully
//      use matching object methods to set mappings
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


//TODO REWRITE
//      use underscores
//      all constants (even attribute id strings into config, maybe split into config and DSL);
//      property tree as attribute:
//          fix property trees in inner nodes (.properties() method)
//          find a way around childattributes (property extractor) or clean up deletion in pathmatching
//          updates data format
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
