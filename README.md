# cpeediff

Command line tool to calculate and visualize the difference between two business process trees conforming to the [CPEE](https://cpee.org) syntax. This tool is part of my bachelor's thesis at the Technical University of Munich (TUM).

## Prerequisites

- Node 16 or higher
## Installation

To install as a command line utility, run `npm install -g @toemmsche/cpeediff`. To verify that the symbolic link to the main.js file has been created, run `cpeediff --help`.

If you want to use CpeeDiff as a module, navigate to your project folder and run `npm install @toemmsche/cpeediff`.

## Usage


### From the command line

- `cpeediff --help` for the list of available commands.
- `cpediff <command> --help` for the list of available options for a command.

Currently, the following commands are available:
- `cpediff diff <old> <new>`: Find differences between two CPEE process trees given as XML documents. The diff is given as a sequence of edit operations endoded in an XML document.
- `cpediff patch <old> <editScript>`: Apply an edit script produced by CpeeDiff to a CPEE process tree. The old tree must be identical to the old tree that was used to generate the edit script.
- `cpediff merge <base> <branch1> <branch2>`: Perform a three-way merge on the specified process trees.
- `cpediff eval <suite>`: Run the automated evaluation framework with the specified test suite.

By default, output XML documents are unformatted and (nearly) impossible to navigate for humans. To pretty-print XML output, use the `--pretty` option.
### As a module

CpeeDiff can only be imported as an ES6 module and will **not** function with `require()` syntax.
```javascript
import {Preprocessor} from '@toemmsche/cpeediff/src/io/Preprocessor.js'
import {CpeeDiff} from '@toemmsche/cpeediff/src/diff/CpeeDiff.js'
import {DiffConfig} from '@toemmsche/cpeediff/src/config/DiffConfig.js'

// Parse process models
const parser = new Preprocessor();
const oldTree = parser.fromFile('old.xml');
const newTree = parser.fromFile('new.xml');

// Express differences as edit script
const differ = new CpeeDiff();
const editScript = differ.diff(oldTree, newTree);

// Enable prettier XML formatting
DiffConfig.PRETTY_XML = true;

// Output as XML document
console.log(editScript.toXmlString());
```
## References

Made with the help of the following npm modules (all licensed under the MIT license):

- [yargs](https://www.npmjs.com/package/yargs) to parse command line arguments.
- [xmldom](https://www.npmjs.com/package/@xmldom/xmldom) for access to XML DOM functions and XML (de-)serialization.
- [murmur-32](https://www.npmjs.com/package/murmur-32) for string hashing.
- [vkbeautify](https://www.npmjs.com/package/vkbeautify) to pretty-print XML documents.
- [markdown-table](https://www.npmjs.com/package/markdown-table) to format the output of the evaluation framework.

For an overview of literature that informed the algorithm design, please consult the bachelor's thesis.