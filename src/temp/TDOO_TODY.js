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
//      sorting in hash matcher and pathmatcher
//      decision to omit deleted node in edit script ? maybe reconsider

//TODO today
//      use private class fields
//      stick to nodejs style guidelines
//      use JSDoc with types except where a description is necessary

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