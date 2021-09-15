# cpeediff

CpeeDiff is an advanced diff tool for business process models conforming to the [CPEE](https://cpee.org) notation. This project is part of my bachelor's thesis at the Technical University of Munich (TUM).

## Prerequisites

- Linux
- Node.js 16.x.x

Although not explicitly tested, CpeeDiff should also work with Node.js 15.x.x.
## Installation

To install globally and as a command line utility, run `npm install -g cpeediff` (root user privileges may be necessary). To verify that the symbolic link to the main.js file has been created, run `cpeediff --help`.

If you want to use CpeeDiff for a single project only, navigate to your project folder and run `npm install cpeediff`.

If you want to install from source, clone this repository, navigate to it, and run `npm install`. This should place all the necessary dependencies in the `node_modules` directory.
## Usage

### From the command line

- `cpeediff --help` for the list of available subcommands.
- `cpediff <command> --help` for the list of available options for a subcommand.

Currently, the following subcommands are available:
- `diff <old> <new>`: Find differences between two CPEE process trees given as XML documents. The diff is given as a sequence of edit operations encoded in an XML document.
- `patch <old> [editScript]`: Apply an edit script produced by CpeeDiff to a CPEE process tree. The given tree must be identical to the tree that was used to generate the edit script.
- `merge <base> <branch1> <branch2>`: Perform a three-way merge with the given process trees.
- `eval <suite>`: Run the automated evaluation framework with the selected test suite.

By default, output XML documents are unformatted and (nearly) impossible to navigate for humans. To pretty-print XML output, use the `--pretty` option.
### As a module

CpeeDiff can only be imported as an ES6 module and will **not** function with `require()` syntax.
```javascript
import {Preprocessor} from 'cpeediff/src/io/Preprocessor.js'
import {CpeeDiff} from 'cpeediff/src/diff/CpeeDiff.js'
import {DiffConfig} from 'cpeediff/src/config/DiffConfig.js'

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

More documentation is available [here](https://toemmsche.github.io/cpeediff/).
## References

Made with the help of the following npm modules (all licensed under MIT):

- [yargs](https://www.npmjs.com/package/yargs) to parse command line arguments.
- [xmldom](https://www.npmjs.com/package/@xmldom/xmldom) for access to XML DOM functions and XML (de-)serialization.
- [murmur-32](https://www.npmjs.com/package/murmur-32) for string hashing.
- [vkbeautify](https://www.npmjs.com/package/vkbeautify) to pretty-print XML documents.
- [markdown-table](https://www.npmjs.com/package/markdown-table) to format the output of the evaluation framework.

For an overview of literature that informed the algorithm design, please consult the bachelor's thesis.