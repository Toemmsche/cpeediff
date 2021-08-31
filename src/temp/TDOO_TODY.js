//TODO
//     comparison boost?
//      eval with tons of variables and lots of documentation
//      evaluate update only, no update
//      place more weight on calls in commonality
//      diff eval for match cases
//      add JNDiff
//      formatting match case
//      merge match test case

//TODO
//      in thesis:
//      edit script is not invertible or commutative
//      minimality of edit script representation --> talk with jürgen
//      remove constant change comparison
//      $$$ compress match comparison
//      not possible to regenerate a matching
//      cpeediff is only one to detect moves to inserted subtrees
//      decision to omit deleted node in edit script ? maybe reconsider
//      element of children(v) notation
//      figure short description argument??
//      which children are unordered?

//TODO today
//      eval weight boost ?????

//TODO  24.8.
//      restructure evaluation in thesis (use avg always)
//      $ simplify test set (no properties)

//TODO  25.8.
//      $$ restructure evaluation in thesis
//      $$continue refactoring eval package
//      craete figure illustrating the merge
//      meet with Jürgen and ask final questions
//          discuss introduction length
//          discuss hand-in
//          meetings doc -->
//      mark abstract methods and override and const

//TODO  26.8.
//      $$$ continue refactoring eval package
//      craete figure illustrating the merge
//      $$$ meet with Jürgen and ask final questions
//          discuss introduction length
//          discuss hand-in
//          meetings doc -->
//      $$$ add loggign to merger and other main threads of exeuction
//      $$$ use destructuring in tree gen
//      class for generated match evaluation
//      move verdicts to ABstractTestCase
//      move statics  from config
//      $$$ use betteer names for DSL elements

//TODO  27.8.
//      craete figure illustrating the merge
//      $$$ add loggign to merger and other main threads of exeuction
//      $$$ use destructuring in tree gen
//      class for generated match evaluation
//      $$$ move verdicts to ABstractTestCase
//      $$$ move statics  from config
//      $$$ missing method/label in comparator
//      $$$ endponit only case
//      $$$ test perfect service call shortcut --> keep for now (not documented in thesis)
//      $$$ unmatched matcher matches (remotely similar) leaf nodes --> SUCCESS! Very good improvement :)

//TODO  27.8.
//      craete figure illustrating the merge
//      class for generated match evaluation


//TODO 29.8.
//      $$ craete figure illustrating the merge
//      Begin implementation overview
//      Begin conclusion and future work
//      $$$ add tinkering refinements to thesis
//      $$$ reorder call comparison in matching thesis

//TODO 30.8.
//      change figure illustrating the merge
//      $$$ Begin implementation overview
//      Begin conclusion and future work
//      $$$ test delta tree for triple extract moves
//      $$$ improve cli
//      $$$ old val in delta tree
//      $$$ merge confidence and xml output
//      option to output matching
//      $$$ patch command
//      $$$ refine commands, remove unnecessary options
//     test variable prefix
//      refactor all test cases -> add init script per default
//    $$$ move ids in delta tree
//      ??? inquire about conditio ndefault val

//IDEA: remove intterup matching in hash, mvoe to sim matching with threshold, reduce path compare range
// eval no threshold for inner AGAIN and try path label comp and try for balanced only



//TODO maybe
//      better commonality complexity
//      remove adjustmenets to change model
//      shorten evaluation
//      selkow and tai in thesis
//      $$$ compress edit script gen phase in thesis
//

/*
TO BEAT for benchmark
6781 376 >-----
| CpeeDiff_quality  | 4840    | 6786    | 61352     | 393           | 72         | 98      | 79      | 144       |
| CpeeDiff_balanced | 4703    | 6805    | 62975     | 425           | 73         | 114     | 78      | 160       |
| CpeeDiff_fast     | 4769    | 6805    | 62975     | 425           | 73         | 114     | 78      | 160       |
 */
//maybe insert arg

/*
NOtes:
Accuracy is higher without hash matching, huh....
 */