#!/usr/bin/env node
import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';
import {DiffConfig} from './config/DiffConfig.js';
import {Preprocessor} from './io/Preprocessor.js';
import {CpeeDiff} from './diff/CpeeDiff.js';
import {DiffEvaluation} from './eval/driver/DiffEvaluation.js';
import {MergeEvaluation} from './eval/driver/MergeEvaluation.js';
import {MatchingEvaluation} from './eval/driver/MatchingEvaluation.js';
import {EvalConfig} from './config/EvalConfig.js';
import * as fs from 'fs';
import {Logger} from './util/Logger.js';
import {CpeeMerge} from './merge/CpeeMerge.js';
import {MatchPipeline} from './diff/match/MatchPipeline.js';
import {Node} from './tree/Node.js';
import {GeneratedDiffEvaluation} from './eval/driver/GeneratedDiffEvaluation.js';
import {GeneratedMatchingEvaluation}
  from './eval/driver/GeneratedMatchingEvaluation.js';
import {EditScript} from './diff/delta/EditScript.js';
import {Patcher} from './diff/patch/Patcher.js';
import {DeltaTreeGenerator} from './diff/patch/DeltaTreeGenerator.js';
import {DiffTestResult} from './eval/result/DiffTestResult.js';
import {DiffTestCase} from './eval/case/DiffTestCase.js';
import {CpeeDiffLocalAdapter} from './eval/diff_adapters/CpeeDiffLocalAdapter.js';
import {markdownTable} from 'markdown-table';

/**
 * @file Main entrypoint for the CpeeDiff command line utility.
 */

const argv = yargs(hideBin(process.argv))
    .option('logLevel', {
      global: true,
      description: 'Choose the desired log level. "all" includes INFO, ' +
          'DEBUG, and STAT messages.',
      alias: 'l',
      type: 'string',
      choices: Object.values(Logger.LOG_LEVELS),
      default: Logger.LOG_LEVELS.ERROR,
    })
    .command(
        'diff <old> <new>',
        'Calculate and show the difference between two CPEE process trees',
        (yargs) => {
          yargs
              .positional('old', {
                description: 'Path to the original CPEE process tree as an ' +
                    'XML document',
                type: 'string',
              })
              .positional('new', {
                description: 'Path to the changed CPEE process tree as an ' +
                    'XML document',
                type: 'string',
              })
              .option('mode', {
                description: 'The matching mode to be used. This affects ' +
                    'the performance and quality of the diff algorithm.',
                alias: 'm',
                type: 'string',
                choices: Object.values(MatchPipeline.MATCH_MODES),
                default: MatchPipeline.MATCH_MODES.QUALITY,
              })
              .option('threshold', {
                description: 'Similarity threshold for matching nodes',
                alias: 't',
                type: 'number',
                default: 0.4,
              })
              .option('variablePrefix', {
                description: 'Prefix used to detect read/written variables in' +
                    ' code and arguments',
                alias: 'v',
                type: 'string',
                default: 'data.',
              })
              .option('format', {
                description: 'Output format. Choice between an XML ' +
                    'edit script, a delta tree, or ' +
                    'the generated matching.',
                alias: 'f',
                type: 'string',
                choices: [
                  'editScript',
                  'deltaTree',
                  'matching',
                  'summary'
                ],
                default: 'editScript',
              })
              .option('pretty', {
                description: 'Pretty-print the output XML document.',
                alias: 'p',
                type: 'boolean',
                default: false,
              })
              .check((argv) => {
                if (!fs.existsSync(argv.old)) {
                  throw new Error(argv.old + ' ist not a valid file path');
                }
                if (!fs.existsSync(argv.new)) {
                  throw new Error(argv.new + ' ist not a valid file path');
                }
                if (argv.threshold < 0 || argv.threshold > 1) {
                  throw new Error('threshold must be in [0,1]');
                }
                return true;
              });
        },
        (argv) => {
          // Configure diff instance
          DiffConfig.VARIABLE_PREFIX = argv.variablePrefix;
          DiffConfig.COMPARISON_THRESHOLD = argv.threshold;
          DiffConfig.MATCH_MODE = argv.mode;
          DiffConfig.LOG_LEVEL = argv.logLevel;
          DiffConfig.PRETTY_XML = argv.pretty;

          const parser = new Preprocessor();
          const oldTree = parser.fromFile(argv.old);
          const newTree = parser.fromFile(argv.new);

          const editScript = new CpeeDiff().diff(
              oldTree,
              newTree,
          );

          Logger.info('Formatting result as ' + argv.format);
          switch (argv.format) {
            case 'editScript': {
              Logger.result(editScript.toXmlString());
              break;
            }
            case 'deltaTree': {
              const deltaTreeGen = new DeltaTreeGenerator();
              const deltaTree = deltaTreeGen.deltaTree(oldTree, editScript);
              Logger.result(deltaTree.toXmlString());
              break;
            }
            case 'matching': {
              // TODO
              Logger.abstractMethodExecution();
            }
            case 'summary': {
              //
              Logger.result('#Nodes (old tree): ' + oldTree.size());
              Logger.result('#Nodes (new tree): ' + oldTree.size());
              const dummyCase = new DiffTestCase('main', oldTree, newTree);
              const result = new CpeeDiffLocalAdapter().evalCase(dummyCase);
              const table = [DiffTestResult.header(), result.values()];
              Logger.result(markdownTable(table));
            }
          }
        },
    )
    .command(
        'eval <suite>',
        'Evaluate the CpeeDiff algorithm and compare against other algorithms',
        (yargs) => {
          yargs
              .positional('suite', {
                description: 'The evaluation suite to run',
                type: 'string',
                choices: [
                  'match',
                  'diff',
                  'merge',
                  'genDiff',
                  'genMatch',
                ],
              })
              .option('timeout', {
                description: 'The time limit for each individual test case ' +
                    'in seconds',
                alias: 't',
                type: 'number',
                default: 30,
              });
        },
        (argv) => {
          if (argv.pretty) {
            Logger.info('Overriding option "pretty" with false');
            argv.pretty = false;
          }
          DiffConfig.PRETTY_XML = argv.pretty;
          DiffConfig.LOG_LEVEL = argv.logLevel;
          EvalConfig.EXECUTION_OPTIONS.timeout = argv.timeout * 1000;
          EvalConfig.RUN_AUTOGENERATED_TESTS = argv.gen;

          Logger.info('Executing test suite ' + argv.suite);
          switch (argv.suite) {
            case 'match': {
              MatchingEvaluation.all().evalAll(EvalConfig.MATCH_CASES_DIR);
              break;
            }
            case 'diff': {
              DiffEvaluation.all().evalAll(EvalConfig.MATCH_CASES_DIR);
              break;
            }
            case 'merge': {
              MergeEvaluation.all().evalAll(EvalConfig.MERGE_CASES_DIR);
              break;
            }
            case 'genDiff': {
              GeneratedDiffEvaluation.all().evalAll();
              break;
            }
            case 'genMatch': {
              GeneratedMatchingEvaluation.all().evalAll();
              break;
            }
          }
        },
    )
    .command(
        'merge <base> <branch1> <branch2>',
        'Perform a three-way merge for process trees',
        (yargs) => {
          yargs
              .positional('base', {
                description: 'Path to the base CPEE process tree as an ' +
                    'XML document',
                type: 'string',
              })
              .positional('branch1', {
                description: 'Path to the first branch CPEE process tree ' +
                    'as an XML document',
                type: 'string',
              })
              .positional('branch2', {
                description: 'Path to the second branch CPEE process tree ' +
                    'as an XML document',
                type: 'string',
              })
              .option('mergeTree', {
                alias: 'mt',
                type: 'boolean',
                default: false,
              })
              .option('pretty', {
                description: 'Pretty-print the output XML document.',
                alias: 'p',
                type: 'boolean',
                default: false,
              })
              .check((argv) => {
                if (!fs.existsSync(argv.base)) {
                  throw new Error(argv.base + ' ist not a valid file path');
                }
                if (!fs.existsSync(argv.branch1)) {
                  throw new Error(argv.branch1 + ' ist not a valid file path');
                }
                if (!fs.existsSync(argv.branch2)) {
                  throw new Error(argv.branch2 + ' ist not a valid file path');
                }
                return true;
              });
        },
        (argv) => {
          DiffConfig.LOG_LEVEL = argv.logLevel;
          DiffConfig.PRETTY_XML = argv.pretty;
          // Parse
          const parser = new Preprocessor();
          const base = parser.fromFile(argv.base);
          const branch1 = parser.fromFile(argv.branch1);
          const branch2 = parser.fromFile(argv.branch2);

          // Merge
          const merger = new CpeeMerge();
          const merged = merger.merge(base, branch1, branch2);

          const format = argv.mergeTree ? 'mergeTree' : 'process tree';
          Logger.info('Formatting merge result as ' + format);
          if (argv.mergeTree) {
            Logger.result(merged.toXmlString());
          } else {
            Logger.result(Node.fromNode(merged).toXmlString());
          }
        },
    )
    .command(
        'patch <old> <editScript>',
        'Patch a document with an edit script',
        (yargs) => {
          yargs
              .positional('old', {
                description: 'Path to the original CPEE process tree as an ' +
                    'XML document',
                type: 'string',
              })
              .positional('editScript', {
                description: 'Path to the edit script as an XML document',
                type: 'string',
              })
              .option('format', {
                description: 'Output format. Choice between the patched ' +
                    'process tree or a delta tree',
                alias: 'f',
                type: 'string',
                choices: [
                  'patched',
                  'deltaTree',
                ],
                default: 'patched',
              })
              .option('pretty', {
                description: 'Pretty-print the output XML document.',
                alias: 'p',
                type: 'boolean',
                default: false,
              })
              .check((argv) => {
                if (!fs.existsSync(argv.old)) {
                  throw new Error(argv.old + ' ist not a valid file path');
                }
                if (!fs.existsSync(argv.editScript)) {
                  throw new Error(argv.editScript +
                      ' ist not a valid file path');
                }
                return true;
              });
        },
        (argv) => {
          DiffConfig.PRETTY_XML = argv.pretty;
          DiffConfig.LOG_LEVEL = argv.logLevel;
          // Parse
          const parser = new Preprocessor();
          const oldTree = parser.fromFile(argv.old);

          const editScriptContent = fs.readFileSync(argv.editScript).toString();
          const editScript = EditScript.fromXmlString(editScriptContent);

          Logger.info('Formatting result as ' + argv.format);
          switch (argv.format) {
            case 'patched': {
              const patcher = new Patcher();
              const patched = patcher.patch(oldTree, editScript);
              Logger.result(patched.toXmlString());
              break;
            }
            case 'deltaTree': {
              const deltaTreeGen = new DeltaTreeGenerator();
              const deltaTree = deltaTreeGen.deltaTree(oldTree, editScript);
              Logger.result(deltaTree.toXmlString());
              break;
            }
          }
        },
    )
    .help()
    .demandCommand()
    .strictCommands()
    .argv;
