/*
 Copyright 2021 Tom Papke

 Licensed under the Apache License, Version 2.0 (the "License"),
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

export const Dsl = {

  XML_DOC: {
    PROPERTIES_ROOT: 'properties',
    DSLX: 'dslx',
    DATA_ELEMENTS: 'dataelements',
    ENDPOINTS: 'endpoints',
  },

  ELEMENTS: {
    DSL_ROOT: {
      label: 'description',
      isLeaf: false,
    },
    CALL: {
      label: 'call',
      isLeaf: true,

    },
    SCRIPT: {
      label: 'manipulate',
      isLeaf: true,

    },
    PARALLEL: {
      label: 'parallel',
      isLeaf: false,

    },
    PARALLEL_BRANCH: {
      label: 'parallel_branch',
      isLeaf: false,

    },
    CHOICE: {
      label: 'choose',
      isLeaf: false,
    },
    ALTERNATIVE: {
      label: 'alternative',
      isLeaf: false,
    },
    OTHERWISE: {
      label: 'otherwise',
      isLeaf: false,
    },
    LOOP: {
      label: 'loop',
      isLeaf: false,
    },
    CRITICAL: {
      label: 'critical',
      isLeaf: false,
    },
    STOP: {
      label: 'stop',
      isLeaf: true,
    },
    BREAK: {
      label: 'escape',
      isLeaf: true,
    },
    TERMINATION: {
      label: 'terminate',
      isLeaf: true,
    },
  },

  CALL_PROPERTIES: {
    ENDPOINT: {
      label: 'endpoint',
    },
    PARAMETERS: {
      label: 'parameters',
    },
    LABEL: {
      label: 'label',
    },
    METHOD: {
      label: 'method',
    },
    ARGUMENTS: {
      label: 'arguments',
    },
    CODE: {
      label: 'code',
    },
    PREPARE: {
      label: 'prepare',
    },
    FINALIZE: {
      label: 'finalize',
    },
    UPDATE: {
      label: 'update',
    },
    RESCUE: {
      label: 'rescue',
    },
  },

  INNER_PROPERTIES: {
    CONDITION: {
      label: 'condition',
      default: 'true'
    },
    LOOP_MODE: {
      label: 'mode',
      options: [
        'pre_test',
        'post_test'
      ],
      default: 'pre_test'
    },
    CHOICE_MODE: {
      label: 'mode',
      options: [
        'exclusive',
        'inclusive'
      ],
      default: 'exclusive'
    },
    PARALLEL_WAIT: {
      label: 'wait',
      default: '-1'
    },
    PARALLEL_CANCEL: {
      label: 'cancel',
      options: [
        'last',
        'first'
      ],
      default: 'last'
    }
  },

  ENDPOINT_METHODS: [
    ':get',
    ':post',
    ':put',
    ':patch',
    ':delete'
  ],

  DEFAULT_NAMESPACE: 'http://cpee.org/ns/description/1.0',
  BASENODE: 'basenode',
  CHANGE_MODEL: {
    INSERTION: {
      label: 'INSERT',
      uri: 'http://cpee.org/ns/description/1.0/insert',
      prefix: 'ins',
    },
    DELETION: {
      label: 'DELETE',
      uri: 'http://cpee.org/ns/description/1.0/delete',
      prefix: 'del',
    },
    MOVE: {
      label: 'MOVE',
      uri: 'http://cpee.org/ns/description/1.0/move',
      prefix: 'mov',
    },
    MOVE_FROM: {
      label: 'MOVE_FROM',
      uri: 'http://cpee.org/ns/description/1.0/move-from',
      prefix: 'movfr',
    },
    UPDATE: {
      label: 'UPDATE',
      uri: 'http://cpee.org/ns/description/1.0/update',
      prefix: 'upd',
    },
    NIL: {
      label: 'NIL',
      uri: 'http://cpee.org/ns/description/1.0/nil',
      prefix: 'nil',
    }
  }

};

Dsl.ELEMENT_SET = new Set(
    Object.values(Dsl.ELEMENTS)
        .map(k => k.label));

Dsl.LEAF_NODE_SET = new Set(
    Object.values(Dsl.ELEMENTS)
        .filter(k => k.isLeaf)
        .map(k => k.label));

Dsl.INNER_NODE_SET = new Set(
    Object.values(Dsl.ELEMENTS)
        .filter(k => !k.isLeaf)
        .map(k => k.label));

Dsl.UNORDERED_SET = new Set(
    Dsl.ELEMENTS.PARALLEL.label,
    ...Object.values(Dsl.CALL_PROPERTIES)
        // Arguments are ordered!
        .filter((property) => property !== Dsl.CALL_PROPERTIES.ARGUMENTS)
        .map((property) => property.label));

Dsl.CHANGE_MODEL_SET = new Set(
    Object.values(Dsl.CHANGE_MODEL));

