import {MatchPipeline} from '../diff/match/MatchPipeline.js';
import {Matching} from '../diff/match/Matching.js';
import {CpeeDiff} from '../diff/CpeeDiff.js';
import {DeltaTreeGenerator} from '../diff/patch/DeltaTreeGenerator.js';
import {Preprocessor} from '../io/Preprocessor.js';
import {Update} from '../diff/patch/Update.js';
import {MergeNode} from './MergeNode.js';
import {Logger} from '../util/Logger.js';

/**
 * A simple matching-based three way merger for process trees.
 */
export class CpeeMerge {
  /**
   * The matching between the branches.
   * @type {Matching}
   */
  #matching;

  /**
   * Apply updates from one node to another.
   * @param {MergeNode} fromNode The node that was updated.
   * @param {MergeNode} toNode The node that was not updated.
   * @private
   */
  #applyUpdate(fromNode, toNode) {
    toNode.attributes.clear();
    for (const [key, val] of fromNode.attributes) {
      toNode.attributes.set(key, val);
    }
    toNode.text = fromNode.text;
    // Updates also contain a change origin
    for (const [updateKey, updateVal] of fromNode.updates) {
      toNode.updates.set(updateKey, updateVal.copy());
      toNode.updates.set(updateKey, updateVal.copy());
    }
  }

  /**
   * Find update and move conflicts.
   * @param {MergeNode} mergeTree The root of the merge tree that should be
   *     searched for move and update conflicts.
   * @return {[Set<MergeNode>, Set<MergeNode>]} The sets of nodes that are
   *     involved in an update and/or move conflict.
   * @private
   */
  #findConflicts(mergeTree) {
    const updateConflicts = new Set();
    const moveConflicts = new Set();

    for (const /** @type {MergeNode} */ node of mergeTree.toPreOrderArray()) {
      if (this.#matching.isMatched(node)) {
        /** @type {MergeNode} */
        const match = this.#matching.getMatch(node);
        // Moved in both branches ?
        if (node.isMoved() &&
            match.isMoved() &&
            node.changeOrigin !== match.changeOrigin) {
          moveConflicts.add(node);
        }
        // Updated in both branches ?
        if (node.isUpdated() && match.isUpdated()) {
          updateConflicts.add(node);
        }

        // Edge case: An inserted node that was matched. Possibly a duplicate
        // insertion.
        if (node.isInserted() && (match.isInserted() || match.isUpdated())) {
          moveConflicts.add(node);
          if (!node.contentEquals(match)) {
            updateConflicts.add(node);
          }
        }
      }
    }
    return [
      updateConflicts,
      moveConflicts,
    ];
  }

  /**
   * Find possible conflicts regarding the position of a node within its
   * parent's child list.
   * @param {MergeNode} mergeTree The root of the merge tree that should be
   *     searched for order conflicts.
   * @private
   */
  #findOrderConflicts(mergeTree) {
    for (const /** @type {MergeNode} */ node of mergeTree.toPreOrderArray()) {
      if (node.parent != null &&
          node.parent.hasInternalOrdering() &&
          (node.isInserted() || node.isMoved())) {
        /** @type {MergeNode} */
        const leftSibling = node.getLeftSibling();
        /** @type {MergeNode} */
        const rightSibling = node.getRightSibling();
        // Order conflicts arise when adjacent nodes where also moved/inserted
        if (leftSibling != null &&
            (leftSibling.isMoved() || leftSibling.isInserted()) &&
            leftSibling.changeOrigin !== node.changeOrigin) {
          node.confidence.positionConfident = false;
          leftSibling.confidence.positionConfident = false;
        }
        if (rightSibling != null &&
            (rightSibling.isMoved() || rightSibling.isInserted()) &&
            rightSibling.changeOrigin !== node.changeOrigin) {
          node.confidence.positionConfident = false;
          rightSibling.confidence.positionConfident = false;
        }
      }
    }
  }

  /**
   * Construct the matching between the merge trees of the two branches.
   * @param {MergeNode} mergeTree1 The root of the first branch merge tree.
   * @param {MergeNode} mergeTree2 The root of the second branch merge tree.
   * @return {Matching}
   */
  #getMatching(mergeTree1, mergeTree2) {
    const baseNodeMap = new Map();
    for (const /** @type {MergeNode} */ node1 of mergeTree1.toPreOrderArray()) {
      if (node1.baseNode != null) {
        baseNodeMap.set(node1.baseNode, node1);
      }
    }
    const matching = new Matching();
    for (const /** @type {MergeNode} */ node2 of mergeTree2.toPreOrderArray()) {
      if (node2.baseNode != null && baseNodeMap.has(node2.baseNode)) {
        matching.matchNew(node2, baseNodeMap.get(node2.baseNode));
      }
    }
    // Find duplicate insertions
    return MatchPipeline
        .fromMode()
        .execute(mergeTree1, mergeTree2, matching);
  }

  /**
   * Handle unmatched nodes in one branch that were deleted in another.
   * @param {MergeNode} mergeTree The root of the merge tree that should be
   *     searched for deletion candidates.
   */
  #handleDeletions(mergeTree) {
    for (const /** @type {MergeNode} */ node of mergeTree.toPreOrderArray()) {
      if (!this.#matching.isMatched(node) && !node.isInserted()) {
        // Node does not have a match and was not inserted. Therefore, its base
        // node was deleted in the other branch. For the sake of data
        // reduction, delete this node as well.
        node.removeFromParent();
      }
    }
  }

  /**
   * Handle non-conflict moves and insertions.
   * @param {MergeNode} mergeTree The root of the merge tree that should be
   *     searched for non-conflict moves and insertions.
   */
  #handleMovesAndInsertions(mergeTree) {
    for (const /** @type {MergeNode} */ node of mergeTree.toPreOrderArray()) {
      if (node.parent == null) continue;
      if (this.#matching.isMatched(node)) {
        /** @type {MergeNode} */
        const match = this.#matching.getMatch(node);
        if (node.isMoved() && !match.isMoved()) {
          // Node was moved in this tree, but not in the other one --> apply
          // move to other tree
          match.removeFromParent();
          this.#insertCorrectly(match, node);
        }
        if (node.isUpdated() && !match.isUpdated() && !match.isInserted()) {
          // update match
          this.#applyUpdate(node, match);
        }
      } else {
        if (node.isInserted()) {
          // Node was inserted in this Tree, not in the other --> insert in
          // other tree
          const copy = MergeNode.fromNode(node, false);
          this.#insertCorrectly(copy, node);
          if (node.changeOrigin === 2) {
            this.#matching.matchNew(node, copy);
          } else {
            this.#matching.matchNew(copy, node);
          }
        }
      }
    }
  }

  /**
   * Insert a node "correctly" in one branch, i.e. with respect to the position
   * of a reference node in the other branch.
   * @param {MergeNode} nodeToInsert The node to insert in a branch.
   * @param {MergeNode} referenceNode The reference node in the other branch.
   */
  #insertCorrectly(nodeToInsert, referenceNode) {
    const newParent = this.#matching.getMatch(referenceNode.parent);
    nodeToInsert.changeOrigin = referenceNode.changeOrigin;
    nodeToInsert.type = referenceNode.type;
    let i = referenceNode.index - 1;
    // Find the first left sibling of the reference Node that is matched to a
    // node within the same parent
    while (i >= 0 &&
    this.#matching.getMatch(referenceNode.parent.getChild(i)).parent !==
    newParent) {
      i--;
    }
    if (i < 0) {
      newParent.insertChild(0, nodeToInsert);
    } else {
      const pre = referenceNode.parent.getChild(i);
      const match = this.#matching.getMatch(pre);
      newParent.insertChild(match.index + 1, nodeToInsert);
    }
  }

  /**
   * Perform a three-way merge on process trees.
   * @param {Node} base The root of the base process tree.
   * @param {Node} branch1 The root of the first branch process tree.
   * @param {Node} branch2 The root of the second branch process tree.
   * @return {Node}
   */
  merge(base, branch1, branch2) {
    const differ = new CpeeDiff();

    Logger.section('CpeeMerge', this);

    // Construct the merge tree for each process tree.
    // It is annotated with difference-related information.

    Logger.info('Diffing base and branch 1...', this);
    let loggingEnabled = Logger.disableLogging();
    const delta1 = differ.diff(base, branch1);

    Logger.info('Diffing base and branch 2...', this);
    loggingEnabled = Logger.disableLogging();
    const delta2 = differ.diff(base, branch2);
    Logger.enableLogging(loggingEnabled);

    const deltaTreeFactory = new DeltaTreeGenerator();
    // Transform into merge trees which can hold additional information
    Logger.info('Constructing delta tree for branch 1...', this);
    const mt1 =
        MergeNode.fromNode(deltaTreeFactory.trimmedDeltaTree(base, delta1));

    Logger.info('Constructing delta tree for branch 2...', this);
    const mt2 =
        MergeNode.fromNode(deltaTreeFactory.trimmedDeltaTree(base, delta2));

    // Get the matching between the merge trees.
    this.#matching = this.#getMatching(mt1, mt2);

    this.#setChangeOrigin(mt1, 1);
    this.#setChangeOrigin(mt2, 2);

    // Delete all unmatched nodes
    Logger.info('Processing deletions...', this);
    this.#handleDeletions(mt1);
    this.#handleDeletions(mt2);
    this.#handleDeletions(mt1);

    Logger.info('Finding conflicts...', this);
    const [updateConflicts, moveConflicts] = this.#findConflicts(mt1);

    // Moves and insertions that only appear in one branch
    Logger.info('Processing moves and insertions...', this);
    this.#handleMovesAndInsertions(mt1);
    this.#handleMovesAndInsertions(mt2);

    Logger.info('Resolving move conflicts...', this);
    this.#resolveMoveConflicts(moveConflicts);
    Logger.info('Resolving update conflicts...', this);
    this.#resolveUpdateConflicts(updateConflicts);

    // Find (unresolvable) order conflicts in the child list of nodes.
    Logger.info('Finding order conflicts...', this);
    this.#findOrderConflicts(mt1);
    this.#findOrderConflicts(mt2);

    // Trimming
    return new Preprocessor().preprocess(mt1);
  }

  /**
   * Resolve move conflicts in favor of branch 1.
   * Advanced or interactive merge conflict handling is out of scope of this
   * tool.
   * @param {Set<MergeNode>} moveConflicts A set of nodes that partake in a
   *     move conflict.
   */
  #resolveMoveConflicts(moveConflicts) {
    for (const node of moveConflicts) {
      /** @type {MergeNode} */
      const match = this.#matching.getMatch(node);
      if (this.#matching.areMatched(node.parent, match.parent)) {
        // Interparent move (same parent)
        node.confidence.positionConfident = false;
        match.confidence.positionConfident = false;
      } else {
        // Far move (new parent)
        node.confidence.parentConfident = false;
        match.confidence.parentConfident = false;
      }
      // Favor branch 1
      match.removeFromParent();
      this.#insertCorrectly(match, node);
    }
  }

  /**
   * Resolve update conflicts by merging the content of two nodes.
   * If a value was changed in both branches, the longer version is retained.
   * Otherwise, changed or removed values always superseded unchanged values.
   * @param {Set<MergeNode>} updateConflicts A set of nodes that partake in an
   *     update conflict.
   */
  #resolveUpdateConflicts(updateConflicts) {
    for (const node of updateConflicts) {
      /** @type {MergeNode} */
      const match = this.#matching.getMatch(node);

      // Edge case: a node is an insertion
      if (node.isInserted()) {
        // Insertion is essentially an update with no pre-existing value
        for (const [key, value] of node.attributes) {
          node.updates.set(key, new Update(null, value, node.changeOrigin));
        }
        node.updates.set(
            'text',
            new Update(null, node.text, node.changeOrigin),
        );
      }
      if (match.isInserted()) {
        for (const [key, value] of match.attributes) {
          match.updates.set(key, new Update(null, value, match.changeOrigin));
        }
        match.updates.set(
            'text',
            new Update(null, match.text, match.changeOrigin),
        );
      }

      for (const [key, update] of node.updates) {
        const newVal = update.newVal;
        // Case 1: Update is exclusive to this branch
        if (!match.updates.has(key)) {
          match.updates.set(key, update.copy());
          if (key === 'text') {
            match.text = newVal;
          } else if (newVal == null) {
            match.attributes.delete(key);
          } else {
            match.attributes.set(key, newVal);
          }
        } else {
          const matchNewVal = match.updates.get(key).newVal;
          // Case 2: Updates are conflicting
          if (newVal !== matchNewVal) {
            // Pick longer version
            if (matchNewVal == null ||
                (newVal != null && newVal.length >= matchNewVal.length)) {
              // Adopt the version of this branch
              match.updates.get(key).newVal = newVal;
              match.updates.get(key).origin = update.origin;
              if (key === 'text') {
                match.text = newVal;
              } else {
                match.attributes.set(key, newVal);
              }
            } else {
              // Adopt the version of the other branch
              node.updates.get(key).newVal = matchNewVal;
              node.updates.get(key).origin = match.updates.get(key).origin;
              if (key === 'text') {
                node.text = matchNewVal;
              } else {
                node.attributes.set(key, matchNewVal);
              }
            }
            // Lose content confidence in both nodes
            node.confidence.contentConfident = false;
            match.confidence.contentConfident = false;
          }
        }
      }

      // Consider non-conflicting updates from other node
      for (const [key, update] of match.updates) {
        const newVal = update.newVal;
        if (!node.updates.has(key)) {
          node.updates.set(key, update.copy());
          if (key === 'text') {
            node.text = newVal;
          } else if (newVal == null) {
            node.attributes.delete(key);
          } else {
            node.attributes.set(key, newVal);
          }
        }
      }
    }
  }

  /**
   * Set a change origin for all nodes of a merge tree.
   * @param {MergeNode} mergeTree The root of the merge tree
   * @param {Number} origin The change origin, i.e. the branch number (1 or 2)
   */
  #setChangeOrigin(mergeTree, origin) {
    for (const /** @type {MergeNode} */ node of mergeTree.toPreOrderArray()) {
      if (!node.isUnchanged()) {
        node.changeOrigin = origin;
        for (const [, update] of node.updates) {
          update.origin = origin;
        }
      }
    }
  }
}

