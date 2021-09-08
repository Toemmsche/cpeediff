/**
 * Configuration object for the difference algorithm.
 * @type {Object}
 */
export const DiffConfig = {

  MATCH_MODE: 'quality',
  LOG_LEVEL: 'error',

  COMPARATOR: {
    PATH_COMPARE_RANGE: 5,

    WEIGHT_BOOST_MULTIPLIER: 1,

    // ====WEIGHTS====
    WRITTEN_VAR_WEIGHT: 1,
    READ_VAR_WEIGHT: 1,

    CALL_ENDPOINT_WEIGHT: 2,
    CALL_METHOD_WEIGHT: 0.5,
    CALL_LABEL_WEIGHT: 1,
    CALL_ARGS_WEIGHT: 1,
    CALL_SERVICE_WEIGHT: 1,
    CALL_CODE_WEIGHT: 1,

    EPSILON_PENALTY: 0.01,

    CONDITION_WEIGHT: 2,
    MODE_WEIGHT: 1,

    CONTENT_WEIGHT: 5,
    POSITION_WEIGHT: 1,
    COMMONALITY_WEIGHT: 6,
  },

  COMPARISON_THRESHOLD: 0.4,
  RELAXED_THRESHOLD: 0.6,

  // Ignore unordered nodes?
  EXACT_EDIT_SCRIPT: false,

  VARIABLE_PREFIX: 'data.',

  PRETTY_XML: false,
};


