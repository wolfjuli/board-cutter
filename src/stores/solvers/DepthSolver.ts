import {BaseSolver} from "./BaseSolver";
import {SolverConfiguration} from "../../types/SolverConfiguration";
import {BaseScorer, Scorer} from "../../modules/Scorer";
import type {Board} from "../../types/Board";
import type {Solution} from "../../types/Solution";
import {TreeNode} from "../../types/TreeNode";


/**
 * Traverses the solution tree depth first and sleeps every time n solutions are found
 * per non-finished solution the actions are taken in the following order:
 * for every nonFitted board:
 *  heightWise in every rest board
 *  widthWise in every rest board
 *  rheightWise in every rest board
 *  rwidthWise in every rest board
 *
 */
export class DepthSolver extends BaseSolver {


  private lastSolution: TreeNode<Solution>
  private pause: boolean

  public constructor(
    configuration: SolverConfiguration = new SolverConfiguration(),
    scorer: Scorer = new BaseScorer(),
    public sleepAmount: number = 10
  ) {
    super(configuration, scorer);
    this.paused.subscribe(p => this.pause = p)
  }

  override startSolver(baseBoard: Board, targetBoards: Board[]) {
    super.startSolver(baseBoard, targetBoards);


    this.objects.subscribe(r => {
      if (r)
        this.lastSolution = new TreeNode(r.solutions[0])
    })
  }

  override solveOne(): boolean {

    let ret: Solution[] = []
    let done = false;

    for (let i: number = 0; i < this.sleepAmount; i++) {
      let next = this.nextSolution()
      if (!next) {
        return done
      }

      ret.push(next)
    }

    if (!ret.length) {
      done = true
      this.cancel()
    }

    this.objects.update(result => {
      result.solutions = this.scorer.scoreAndSort(this.distinct([...result.solutions, ...ret]))
      return result
    })

    return done
  }

  private nextSolution(current: TreeNode<Solution> = this.lastSolution): Solution {
    let solution = current.payload
    let allKeys = Object.keys(current.children)
    if (current.payload.finished) {
      if (current.parent)
        return this.nextSolution(current.parent) //backtrack
      else
        return null
    }

    for (const baseTargetBoard of solution.nonFittedBoards) {
      for (const baseBoard of solution.restBoards) {
        for (let widthWise = 0; widthWise < 2; widthWise++) {
          for (let rotated = 0; rotated < 1 + (+this.configuration.rotationAllowed); rotated++) {
            let key = this.calculateKey(baseTargetBoard, baseBoard, !!widthWise, !!rotated)

            if (allKeys.find(k => k == key))
              continue


            let targetBoard = baseTargetBoard.copy()

            if (rotated) targetBoard.rotate()

            let restBoards: Board[] = []
            if (widthWise)
              restBoards = this.splitWidthFirst(baseBoard, targetBoard)
            else
              restBoards = this.splitHeightFirst(baseBoard, targetBoard)


            let newSolution = solution.copy().appendFittedBoards(targetBoard).removeNonFittedBoard(baseTargetBoard)
            if (restBoards)
              newSolution.appendRestBoards(...restBoards)

            newSolution.finished = newSolution.failed = !restBoards
            newSolution.finished = newSolution.finished || !newSolution.nonFittedBoards.length

            let newNode = new TreeNode(newSolution, this.lastSolution)
            this.lastSolution.children[key] = newNode
            this.lastSolution = newNode
            return newSolution
          }
        }
      }
    }
  }

  private calculateKey(targetBoard: Board, baseBoard: Board, widthWise: boolean, rotated: boolean) {
    return `${targetBoard.id}:${baseBoard.id}:${rotated ? "r" : ""}${widthWise ? "w" : "h"}`
  }

  private possibleChildren(node: TreeNode<Solution>): number {
    let solution = node.payload
    if (solution.finished || solution.failed)
      return 0

    return solution.nonFittedBoards.length * solution.restBoards.length * 2 * (+this.configuration.rotationAllowed * 2)
  }
}
