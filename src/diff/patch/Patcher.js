import {Dsl} from '../../config/Dsl.js';
import {Node} from '../../tree/Node.js';

/**
 * A wrapper class for the patching capabilities of CpeeDiff.
 */
export class Patcher {
  /**
   * @type {Node}
   * @private
   */
  #tree;

  /**
   * Apply an edit script to a tree.
   * @param {Node} tree The root of the tree. It will not be modified.
   * @param {EditScript} editScript
   * @return {Node} The root of the editOpd tree.
   */
  patch(tree, editScript) {
    // Copy the old tree
    this.#tree = Node.fromNode(tree);

    for (const editOp of editScript.editOperations) {
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
    return this.#tree;
  }

  /**
   * @param {EditOperation} move
   */
  #handleMove(move) {
    const movedNode = this.#tree.findNode(move.oldPath);
    movedNode.removeFromParent();

    // Extract new child index
    const indexArr =
        move
            .newPath
            .split('/')
            .map((str) => parseInt(str));
    const index = indexArr.pop();

    // Find parent node
    const targetParent = this.#tree.findNode(indexArr.join('/'));

    targetParent.insertChild(index, movedNode);
  }

  /**
   * @param {EditOperation} insertion
   */
  #handleInsertion(insertion) {
    // Extract new child index
    const indexArr =
        insertion
            .newPath
            .split('/')
            .map((str)=> parseInt(str));
    const index = indexArr.pop();

    // Find parent node
    const parent = this.#tree.findNode(indexArr.join('/'));

    // Insert
    const newNode = Node.fromNode(insertion.newContent, true);
    parent.insertChild(index, newNode);
  }

  /**
   * @param {EditOperation} update
   */
  #handleUpdate(update) {
    const node = this.#tree.findNode(update.oldPath);

    node.attributes.clear();
    for (const [key, val] of update.newContent.attributes) {
      node.attributes.set(key, val);
    }
    node.text = update.newContent.text;
  }

  /**
   * @param {EditOperation} deletion
   */
  #handleDeletion(deletion) {
    this.#tree.findNode(deletion.oldPath).removeFromParent();
  }
}
