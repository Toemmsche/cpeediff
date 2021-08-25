//TODO
//     comparison boost?
//      eval with tons of variables and lots of documentation
//      evaluate update only, no update
//      place more weight on calls in commonality
//      figure out hwo to deal with licenses in paper and code (ASK JÜRGEN)
//      diff eval for match cases
//      add JNDiff
//      formatting match case
//      merge match test case

//TODO
//      in thesis:
//      edit script is not invertible or commutative
//      remove constant change comparison
//      compress match comparison
//      not possible to regenerate a matching
//      cpeediff is only one to detect moves to inserted subtrees
//      decision to omit deleted node in edit script ? maybe reconsider
//      element of children(v) notation
//      figure short description argument??
//      which children are unordered?
//      add JNDiff

//TODO today
//      eval weight boost ?????
//      $$$ find solution to "with equation" and citeyear in section title
//      $ apply rules from Jürgen
//      $$$ test base content similarity --> no restriction in similarity
//      $$$ add jsdoc to properties and extend to test
//      $$ add const where applicable
//      $$ use fancy features like || and ??

//TODO  24.8.
//      $$$ clean up $$ merge and deltatree gen --> experimental (look at notes)
//      restructure evaluation in thesis (use avg always)
//      $ simplify test set (no properties)
//      $$$ remove matchNew (can just use match()) -> bad idea (path matching...)

//TODO  25.8.
//      $$ restructure evaluation in thesis
//      continue refactoring eval package
//      craete figure illustrating the merge
//      meet with Jürgen and ask final questions
//          discuss introduction length
//          discuss hand-in
//          meetings doc -->
//      mark abstract methods and override and const

//TODO maybe
//      better commonality complexity
//     adjust change model of DIffxml to include updates
//      remove adjustmenets to change model
//      try guaranteed inner match again, that must be better...
//      selkow and tai in thesis
//      compress edit script gen phase in thesis
//      add persistbestmatches in thesis as pseudocode

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