import {Board} from "../../types/Board";
import {Solution} from "../../types/Solution";
import {BaseVolatileStore} from "../BaseVolatileStore";
import {SolverResult} from "../../types/SolverResult";
import {writable, Writable} from "svelte/store";
import type {SolverConfiguration} from "../../types/SolverConfiguration";
import type {Scorer} from "../../modules/Scorer";
import {logDebug} from "../../modules/Extensions";

export abstract class BaseSolver extends BaseVolatileStore<SolverResult> {

  public paused: Writable<boolean> = writable(false)

  protected worker: NodeJS.Timer = null

  protected constructor(
    protected configuration: SolverConfiguration = null,
    protected scorer: Scorer = null
  ) {
    super();
  }

  public startSolver(
    baseBoard: Board,
    targetBoards: Board[],
  ): SolverResult {
    if (targetBoards.length > 0) {
      let allTargetBoards: Board[] = targetBoards.map(b => {
        return Array.from({length: b.amount}, () => b.copy())
      }).flat()

      this.cancel()

      let result = new SolverResult(
        [new Solution([], [baseBoard], allTargetBoards)],
        this.configuration,
        this.scorer
      )

      this.objects.update(() => result)

      logDebug("Start solving")

      this.resumeSolving()

      return result
    }
  }

  public resumeSolving() {
    this.paused.set(false)

    if (this.worker)
      return

    this.worker = setInterval(() => {
      if (this.solveOne()) {
        clearInterval(this.worker)
        this.worker = null


        logDebug("Finished solving")
      }
    }, this.configuration.intervalMs)
  }

  public pauseSolving() {
    this.paused.set(true)

    if (this.worker) {
      clearInterval(this.worker)
      this.worker = null
    }
  }

  public cancel() {
    if (this.worker) {
      clearInterval(this.worker)
      this.worker = null
    }
  }

  /**
   * Makes one step in solving (to be timeout-blocked)
   * Returns true if no more solution exists, false otherwise
   * @protected
   */
  protected abstract solveOne(): boolean

  /**
   * Cuts the baseBoard in at most 2 new baseBoards, given targetBoard. Considers rotation
   *
   * Returns null, if the cut is not possible (width AND height of targetBoard need to be within baseBoard)
   * Returns array len 1, if one of the resulting baseBoards would be 0 in either height or width
   *
   * @param baseBoard The base board to be split widthWise in the height defined by
   * @param targetBoard The targetBoard, which defines the cut height
   * @private
   */
  protected splitWidthFirst(
    baseBoard: Board,
    targetBoard: Board
  ): Board[] {
    let newHeight = baseBoard.height - targetBoard.height
    let newWidth = baseBoard.width - targetBoard.width

    if (newWidth < 0 || newHeight < 0)
      return null

    let rightBoard = new Board(newWidth - this.configuration.bladeWidth, targetBoard.height)
    rightBoard.rightOf(targetBoard, this.configuration.bladeWidth)

    let lowerBoard = new Board(baseBoard.width, newHeight - this.configuration.bladeWidth)
    lowerBoard.belowOf(targetBoard, this.configuration.bladeWidth)

    return [rightBoard, lowerBoard].filter(b => b.width > 0 && b.height > 0)
  }

  /**
   * Cuts the baseBoard in at most 2 new baseBoards, given targetBoard. Considers rotation
   *
   * Returns emptyArray, if the cut is not possible (width AND height of targetBoard need to be within baseBoard)
   * Returns array len 1, if one of the resulting baseBoards would be 0 in either height or width
   *
   * @param baseBoard The base board to be split heightWise in the width defined by targetBoard
   * @param targetBoard The targetBoard, which defines the cut width
   * @private
   */
  protected splitHeightFirst(baseBoard: Board,
                             targetBoard: Board
  ): Board[] {
    let newHeight = baseBoard.height - targetBoard.height
    let newWidth = baseBoard.width - targetBoard.width

    if (newWidth < 0 || newHeight < 0)
      return null

    let rightBoard = new Board(newWidth - this.configuration.bladeWidth, baseBoard.height)
    rightBoard.rightOf(targetBoard, this.configuration.bladeWidth)

    let lowerBoard = new Board(targetBoard.width, newHeight - this.configuration.bladeWidth)
    lowerBoard.belowOf(targetBoard, this.configuration.bladeWidth)

    return [rightBoard, lowerBoard].filter(b => b.width > 0 && b.height > 0)
  }

  protected distinct(solutions: Solution[]): Solution[] {
    let ret: Solution[] = []

    solutions.forEach(s => {
      if (!ret.find(r => r.similar(s)))
        ret.push(s)
    })

    return ret
  }
}
