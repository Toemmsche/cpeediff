//TODO features
//      preserve deleted nodes for tree output
//      copy model
//      output whole tree at subtree insertion
//      export set and map similarity calculations
//      take proper snapshot
//      add consistency check for data dependencies (variables are declared as data elements (all?)
//      conflict groups for reshuffling
//      add reshuffling in merger


//TODO new algos
//      fast match by Chawathe et al.
//      Simple match by Chawathe et al.
//      optimize matching
//      matchSimilarUnmatched() by 3DM

//TODO semi-features
//      maybe just use cpeenode, no subclasses (because of json)
//      output path instead of attributes
//      constant values such as t in matchdiff should be options
//      add verbose function
//      command line interface (help, error messages, logging, etc.)
//      use global variable for options
//      option to turn of preprocessing like removing description nodes or empty control flow structures
//      use existing code diff tools to evalute script similarity
//      use path as key in call comparison
//      convert cpeemodel back to XML
//      IMPORTANT use default parameters to simplify postorder methods etc.
//      use inner no0de matching to match leaf nodes in similar trees even when they're slightly different
//      diff method is static
//      make parseFromJSON return properly typed and instantiated (parent and path) object


//TODO tidy
//      replace nodeequals with === where applicable
//      encapsulate handleInsert() in edit script generation
//      diff() performes conversion to CPEEModel
//      use arrow notation (or dont use private function)
//      use patchbuilder
//      turn path into method
//      declare all variables at function start
//      maybe mark clearly which nodes belong to which tree
//      Deicision options in diff or class
//      Add documentation to _important_ local variables (eg DP array)
//      find a way to copy gracefully
//      use matching object methods to set mappings
//      fix parallel
//      replace label comparison with instanceof
//      use multiple inheritance for call otherwise etc.
//      find cleaner way to get node attributes (e.g. is property node)
//      use scientific names for variables
//      maybe change member variable declaration and initiliazation
//      use constructor for node comparison
//      move node boolean flags into cpeemodel to keep semantic parsing in one place
//      rename root to node in model

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
