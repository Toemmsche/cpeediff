import {EditScript} from './EditScript.js';
import {Config} from '../Config.js';
import {getLis} from '../lib/Lis.js';
import {Logger} from '../../util/Logger.js';
import {Node} from '../tree/Node.js';

/**
 * A generator that produces edit scripts conforming to (any) matching.
 */
export class EditScriptGenerator {
  /** @type {Matching} */
  #matching;
  /** @type {EditScript} */
  #editScript;

  /**
   * Find the optimal target index for an insertion.
   * @param {Node} newNode The node whose match should be inserted.
   * @return {Number} The optimal insertion index.
   */
  #findInsertionIndex(newNode) {
    let insertionIndex;
    if (newNode.index > 0) {
      const leftSibling = newNode.getSiblings()[newNode.index - 1];
      // Left sibling has a match
      insertionIndex = this.#matching.getNew(leftSibling).index + 1;
    } else {
      insertionIndex = 0;
    }
    return insertionIndex;
  }

  /**
   * Align the children of a node.
   * @param {Node} oldParent A node from the old (original) tree.
   */
  #alignChildren(oldParent) {
    const nodes = oldParent.children;
    // To find the minimal number of moves, map each child to the index of
    // its matching partner and compute the longest increasing subsequence (LIS)
    // on the result. Every node that isn't part of the LIS must be moved.
    const lis = getLis(nodes.map((node) => this.#matching.getOld(node).index));

    const inLis = new Set();
    for (const index of lis) {
      inLis.add(nodes[index]);
    }

    outer: for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (!inLis.has(node)) {
        // Node will be part of the LIS
        inLis.add(node);
        // The node may be moved further back in the node list.
        // In order to also consider the following node,
        // we must move the iteration index back.
        i--;
        const oldPath = node.xPath();
        // Find the first node that is part of the LIS whose destined index is
        // larger than the destined index of node.
        const thisMatchIndex = this.#matching.getOld(node).index;
        for (let j = 0; j < nodes.length; j++) {
          const lisMatchIndex = this.#matching.getOld(nodes[j]).index;
          if (inLis.has(nodes[j]) && lisMatchIndex > thisMatchIndex) {
            // Move within nodes, adjust index for move further back
            node.changeIndex(j > node.index ? j - 1 : j);
            const newPath = node.xPath();
            this.#editScript.move(oldPath, newPath);
            continue outer;
          }
        }
        // Move to end of nodes
        node.changeIndex(nodes.length - 1);
        const newPath = node.xPath();
        this.#editScript.move(oldPath, newPath);
      }
    }
  }

  /** @param {Node} oldNode The node to delete */
  #delete(oldNode) {
    oldNode.removeFromParent();
    this.#editScript.delete(oldNode);
  }

  /**
   * Generate an edit script from the provided matching.
   * @param {Node} oldTree The root of the old (original) tree.
   *     WARNING: It will be modified in the process.
   * @param {Node} newTree The new (changed) tree.
   * @param {Matching} matching A matching between the nodes of the trees.
   * @return {EditScript} A minimum conforming edit script.
   */
  generateEditScript(oldTree, newTree, matching) {
    Logger.info('Generating edit script...', this);
    Logger.startTimed();

    // For edit script verification later on
    const copyOfOld = Node.fromNode(oldTree);

    this.#matching = matching;
    this.#editScript = new EditScript();

    // 1st traversal: Pre-order of new (changed) tree
    const newPreOrder = newTree.toPreOrderArray();
    for (const newNode of newPreOrder) {
      if (matching.hasNew(newNode)) {
        // New node is matched -> Move, Update, or Nil
        const match = matching.getNew(newNode);
        // Move if parents of matched nodes aren't matched
        if (!newNode.isRoot() &&
            matching.getNew(newNode.parent) !== match.parent) {
          this.#move(match);
        }
        // Update if the content (text & attributes) of matched nodes differs
        if (!newNode.contentEquals(match)) {
          this.#update(match);
        }
      } else {
        // New node is not matched -> Insertion
        this.#insert(newNode);
      }
    }

    const oldPreOrder = oldTree.toPreOrderArray();
    for (let i = 0; i < oldPreOrder.length; i++) {
      const oldNode = oldPreOrder[i];
      if (!matching.hasOld(oldNode)) {
        // Old node is not matched.
        // We can be certain that none of its descendants are matched either.
        // -> Deletion of the subtree rooted at this node
        i += oldNode.size() - 1;
        this.#delete(oldNode);
      }
    }

    // TODO remove soon
    for (const newNode of newTree.toPreOrderArray()) {
      if (!matching.hasNew(newNode)) {
        throw new Error();
      }
    }
    for (const oldNode of oldTree.toPreOrderArray()) {
      if (!matching.hasOld(oldNode)) {
        throw new Error();
      }
    }

    // The matching and old tree are well-formed in terms of parent-child
    // relationships. However, the children of a node might still be misaligned.
    // This can occur if a node as moved within its parent.
    for (const oldNode of oldTree.toPreOrderArray()) {
      if (Config.EXACT_EDIT_SCRIPT || oldNode.hasInternalOrdering()) {
        this.#alignChildren(oldNode);
      }
    }

    // Verify the validity of the edit script
    if (!this.#editScript.isValid(copyOfOld, newTree)) {
      Logger.error('Generated edit script is not valid',
          new Error('Generated edit script is not valid'), this);
    }

    Logger.stat('Edit script generation took ' +
        Logger.endTimed() + 'ms', this);
    Logger.stat('Cost of edit script: ' + this.#editScript.cost, this);
    return this.#editScript;
  }

  /** @param {Node} newNode The node (or subtree) to insert. */
  #insert(newNode) {
    const copy = Node.fromNode(newNode, true);

    const deleteLater = [];
    const matchOrRemove = (copiedNode, newNode) => {
      if (this.#matching.hasNew(newNode)) {
        deleteLater.push(copiedNode);
      } else {
        this.#matching.matchNew(newNode, copiedNode);
        for (let i = 0; i < copiedNode.degree(); i++) {
          matchOrRemove(copiedNode.getChild(i), newNode.getChild(i));
        }
      }
    };
    matchOrRemove(copy, newNode);
    for (const copiedNode of deleteLater) {
      copiedNode.removeFromParent();
    }

    // Find appropriate insertion index
    const insertionIndex = this.#findInsertionIndex(newNode);

    // Perform insert operation at match of the parent node
    const newParent = this.#matching.getNew(newNode.parent);
    newParent.insertChild(insertionIndex, copy);

    this.#editScript.insert(copy);
  }

  /** @param {Node} oldNode The node to move. The destination is inferred. */
  #move(oldNode) {
    const newNode = this.#matching.getOld(oldNode);
    const oldPath = oldNode.xPath();
    // Delete from tree
    oldNode.removeFromParent();

    // Find appropriate insertion index
    const insertionIndex = this.#findInsertionIndex(newNode);

    const newParent = this.#matching.getNew(newNode.parent);
    newParent.insertChild(insertionIndex, oldNode);
    const newPath = oldNode.xPath();
    this.#editScript.move(oldPath, newPath);
  }

  /** @param {Node} oldNode The node to be updated. */
  #update(oldNode) {
    const newNode = this.#matching.getOld(oldNode);

    // Overwrite old values
    oldNode.attributes = new Map();
    for (const [key, val] of newNode.attributes) {
      oldNode.attributes.set(key, val);
    }
    oldNode.text = newNode.text;
    this.#editScript.update(oldNode);
  }
}
