/**
 * Object containing information about the Domain Specific Language of the
 * Cloud Process Execution Engine and the change model of CpeeDiff.
 *
 * @see {https://cpee.org}
 * @type {Object}
 */
export const Dsl = {

  XML_DOC: {
    DATA_ELEMENTS: 'dataelements',
    ENDPOINTS: 'endpoints',
    WRAPPER: 'dslx',
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
      default: 'true',
    },
    LOOP_MODE: {
      label: 'mode',
      options: [
        'pre_test',
        'post_test',
      ],
      default: 'pre_test',
    },
    CHOICE_MODE: {
      label: 'mode',
      options: [
        'exclusive',
        'inclusive',
      ],
      default: 'exclusive',
    },
    PARALLEL_WAIT: {
      label: 'wait',
      default: '-1',
    },
    PARALLEL_CANCEL: {
      label: 'cancel',
      options: [
        'last',
        'first',
      ],
      default: 'last',
    },
  },

  ENDPOINT_METHODS: [
    ':get',
    ':post',
    ':put',
    ':patch',
    ':delete',
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
    UPDATE_FROM: {
      label: 'UPDATE_FROM',
      uri: 'http://cpee.org/ns/description/1.0/update-from',
      prefix: 'updfr',
    },
    NIL: {
      label: 'NIL',
      uri: 'http://cpee.org/ns/description/1.0/nil',
      prefix: 'nil',
    },
  },

  MERGE_TREE: {
    NAMESPACE_URI: 'http://cpee.org/ns/description/1.0/three-way-merge',
    NAMESPACE_PREFIX: 'm3',
    NODE_CHANGE_ORIGIN_KEY: 'this',
    POSITION_CONFIDENCE_KEY: 'positionConfident',
    PARENT_CONFIDENCE_KEY: 'parentConfident',
    CONTENT_CONFIDENCE_KEY: 'contentConfident',
  },

  DELTA_TREE: {
    TEXT_UPDATE_KEY: 'text',
    MOVE_KEY: 'moveID',
  },
};

Dsl.ELEMENT_SET = new Set(
    Object.values(Dsl.ELEMENTS)
        .map((k) => k.label));

Dsl.LEAF_NODE_SET = new Set(
    Object.values(Dsl.ELEMENTS)
        .filter((k) => k.isLeaf)
        .map((k) => k.label));

Dsl.INNER_NODE_SET = new Set(
    Object.values(Dsl.ELEMENTS)
        .filter((k) => !k.isLeaf)
        .map((k) => k.label));


