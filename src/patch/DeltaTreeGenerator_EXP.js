import {Dsl} from '../Dsl.js';
import {IdExtractor} from '../extract/IdExtractor.js';
import {Update} from './Update.js';
import {DeltaNode} from './DeltaNode.js';
import {Logger} from '../../util/Logger.js';
import {Node} from '../tree/Node.js';

/**
 * Generator class for delta trees, i.e. process trees that are annotated with
 * diff-related information
 * @see {DeltaNode}
 */
export class DeltaTreeGenerator_EXP {
  /** @type  {DeltaNode} */
  #deltaTree;
  /**
   * A map that assigns each moved node a placeholder node at its old position.
   * @type {Map<DeltaNode, DeltaNode>} */
  #moveMap;

  /**
   * @param {DeltaNode} node
   */
  #applyDelete(node) {
    for (const descendant of node.toPreOrderArray()) {
      descendant.type = Dsl.CHANGE_MODEL.DELETION.label;
    }

    node.removeFromParent();
    node.parent.placeholders.push(node);
  }

  /**
   * @param {DeltaNode} parent
   * @param {DeltaNode} node
   * @param {Number} index
   */
  #applyInsert(parent, node, index) {
    // Copy the inserted node
    const child = DeltaNode.fromNode(node, true);
    parent.insertChild(index, child);
    for (const descendant of child.toPreOrderArray()) {
      descendant.type = Dsl.CHANGE_MODEL.INSERTION.label;
    }
  }

  /**
   * @param {DeltaNode} node
   * @param {Node} newContent
   */
  #applyUpdate(node, newContent) {
    // Detect changes to text content
    if (node.text !== newContent.text) {
      node.updates.set('text', new Update(node.text, newContent.text));
      node.text = newContent.text;
    }

    // Detect updated and inserted attributes
    for (const [key, value] of newContent.attributes) {
      if (node.attributes.has(key)) {
        if (node.attributes.get(key) !== value) {
          node.updates.set(key, new Update(node.attributes.get(key), value));
          node.attributes.set(key, value);
        }
      } else {
        node.updates.set(key, new Update(null, value));
        node.attributes.set(key, value);
      }
    }

    // Detect deleted attributes
    for (const [key, value] of node.attributes) {
      if (!newContent.attributes.has(key)) {
        node.updates.set(key, new Update(value, null));
        node.attributes.delete(key);
      }
    }
  }

  /**
   * Create a standard delta tree out of a base tree and an edit script.
   * The standard delta tree does not contain "move from" and "deleted"
   * placeholders.
   * @param {Node} tree The root of the tree to transform into a delta tree.
   * @param {EditScript} editScript The delta.
   * @return {DeltaNode} The root of the delta tree.
   */
  deltaTree(tree, editScript) {
    // Copy the tree as a delta node
    this.#deltaTree = DeltaNode.fromNode(tree, true);
    this.#moveMap = new Map();

    // Node IDs are equal to the index in the pre-order array
    const idExtractor = new IdExtractor();
    for (const node of this.#deltaTree.toPreOrderArray()) {
      node.baseNode = idExtractor.get(node);
    }

    for (const editOp of editScript) {
      switch (editOp.type) {
        case Dsl.CHANGE_MODEL.INSERTION.label: {
          this.#handleInsertion(editOp);
          break;
        }
        case Dsl.CHANGE_MODEL.MOVE.label: {
          this.#handleMove(editOp);
          break;
        }
        case Dsl.CHANGE_MODEL.UPDATE.label: {
          this.#handleUpdate(editOp);
          break;
        }
        case Dsl.CHANGE_MODEL.DELETION.label: {
          this.#handleDeletion(editOp);
          break;
        }
      }
    }

    return this.#deltaTree;
  }

  /**
   * Create an extended delta tree out of a base tree and an edit script.
   * The extended delta tree contains "move from" and "deleted"
   * placeholders.
   * @param {Node} tree The root of the tree to transform into a delta tree.
   * @param {EditScript} editScript The delta.
   * @return {DeltaNode} The root of the delta tree.
   */
  extendedDeltaTree(tree, editScript) {
    this.#deltaTree = this.deltaTree(tree, editScript);
    this.#resolvePlaceholders(this.#deltaTree);
    this.#trim();
    return this.#deltaTree;
  }

  /**
   * @param {String} indexPath
   * @return {DeltaNode} [regular node, movfrNode].
   */
  #findWithMovfr(indexPath) {
    let currNode = this.#deltaTree;
    if (indexPath !== '') {
      for (const index of indexPath
          .split('/') // Remove root path "/"
          .map((str) => parseInt(str))) {
        if (index >= currNode.degree()) {
          const msg = 'Edit script not applicable to tree';
          Logger.error(msg, new Error(msg), this);
        }
        currNode = currNode.getChild(index);
      }
    }

    return currNode;
  }

  /**
   * @param {EditOperation} deletion
   */
  #handleDeletion(deletion) {
    const node = this.#findWithMovfr(deletion.oldPath);

    this.#applyDelete(node);
  }

  /**
   * @param {EditOperation} insertion
   */
  #handleInsertion(insertion) {
    const indexArr =
        insertion
            .newPath
            .split('/')
            .map((str) => parseInt(str));
    const index = indexArr.pop();
    const parent = this.#findWithMovfr(indexArr.join('/'));

    this.#applyInsert(parent, insertion.newContent, index);
  }

  /**
   * @param {EditOperation} move
   */
  #handleMove(move) {
    // Find moved node
    const node = this.#findWithMovfr(move.oldPath);

    // Detach regular node
    node.removeFromParent();

    const nodeParent = node.parent;
    node.parent.placeholders.push(node);

    // Find the new parent
    const parentIndexArr =
        move
            .newPath
            .split('/')
            .map((str) => parseInt(str));
    const targetIndex = parentIndexArr.pop();
    const parent = this.#findWithMovfr(parentIndexArr.join('/'));

    // Insert regular node
    parent.insertChild(targetIndex, node);
  }

  /**
   * @param {EditOperation} update
   */
  #handleUpdate(update) {
    const node = this.#findWithMovfr(update.oldPath);
    const newContent = update.newContent;

    this.#applyUpdate(node, newContent);
  }

  #resolvePlaceholders() {

  }

  /**
   * Trim excess nodes resulting from move operations.
   */
  #trim() {
    for (const /** @type {DeltaNode} */ deltaNode of this.#deltaTree.toPreOrderArray()) {
      // TODO
      if (deltaNode.label === 'dummy') {
        deltaNode.removeFromParent();
        continue;
      }
      if (deltaNode.isMoved()) {
        deltaNode
            .toPreOrderArray()
            .forEach((descendant) => {
              if (descendant.isMovedFrom()) {
                descendant.removeFromParent();
              }
            });
      } else if (deltaNode.isMovedFrom()) {
        deltaNode
            .toPreOrderArray()
            .forEach((descendant) => {
              if (descendant.isMoved()) {
                descendant.removeFromParent();
              }
            });
      }
    }
  }
}

