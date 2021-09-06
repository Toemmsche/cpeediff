# CpeeDiff

Command line tool to calculate and visualize the difference between two business process trees conforming to the [CPEE](https://cpee.org) syntax. This tool is part of my bachelor's thesis at the Technical University of Munich (TUM).

## Installation

Coming soon...

## Usage


### From the command line

Use `node main.js --help` for the list of available commands.
Use `node main.js <command> --help` for the list of available options for a command.

### As a module

CpeeDiff can only be imported as an ES6 module.
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
`
## References

Made with the help of the following npm modules (all licensed under the MIT license):

- [yargs](https://www.npmjs.com/package/yargs)
- [xmldom](https://www.npmjs.com/package/@xmldom/xmldom)
- [murmur-32](https://www.npmjs.com/package/murmur-32)
- [vkbeautify](https://www.npmjs.com/package/vkbeautify)
- [markdown-table](https://www.npmjs.com/package/markdown-table)

For an overview of literature that informed the algorithm design, please consult the bachelor's thesis.