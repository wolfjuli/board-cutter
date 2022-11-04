import {Board} from "../types/Board";
import {logDebug, logError} from "./Extensions";

/***
 * Finds the best distribution/orientation of the targetBoards within the baseBoard, based on score:
 * Amount of rest: * -1 (better few big boards than a lot of small ones)
 * Area of the biggest rest: * 10
 * Longest length of rest: base.length - length
 * Every rotation: * -1
 * Not fitting boards: area * -10
 *
 * Idea: Place first board at 0 0, cut along width - results in 2 boards, cut the first board along height, repeat with
 * the 2 newly created rest boards. Repeat as long as there are missing targetBoards.
 *
 * Quit iteration, if:
 *  - Iteration has not changed the result (boards left over which doesn't fit
 *  - there are no targetBoards left
 *
 * Then calculate score
 */

class Solution {

    constructor(
        public fittedBoards: Board[] = [],
        public restBoards: Board[] = [],
        public nonFittedBoards: Board[] = [],
        public parentSolution: Solution = null
    ) {
    }

    appendFittedBoards(...board: Board[]): Solution {
        this.fittedBoards.push(...board)
        return this
    }

    appendRestBoards(...board: Board[]): Solution {
        this.restBoards.push(...board)
        return this
    }

    copy(): Solution {
        return new Solution(
            [...this.fittedBoards],
            [...this.restBoards],
            [...this.nonFittedBoards],
            this.parentSolution
        )
    }
}

export class Solver {

    public solutions = []

    constructor(baseBoard: Board, targetBoards: Board[]) {
        if (targetBoards.length > 0)
            this.solutions = this.solve(baseBoard, targetBoards)
        else
            logDebug("targetBoards is empty")
    }

    private solve(baseBoard: Board, targetBoards: Board[]): Solution[] {

        logDebug("Start solving:", baseBoard, targetBoards)
        let allSolutions: Solution[] = []
        let partialSolutions: Solution[] = [new Solution(
            [],
            [baseBoard],
            [...targetBoards]
        )]


        let counter = 0
        while (partialSolutions.length > 0) {
            allSolutions.push(...partialSolutions)
            partialSolutions = partialSolutions.map(solution => {
                return targetBoards.map((b) => {
                    return this.partialSolve(solution, b.id)
                }).flat()

            }).flat()

            if (counter++ > 20) {
                logError("Too many steps")
                return allSolutions.filter(s => parents.indexOf(s) == -1)
            }
        }

        logDebug(allSolutions)
        let parents = allSolutions.map(s => s.parentSolution)
        return allSolutions.filter(s => parents.indexOf(s) == -1)

    }

    /***
     * Removes the given targetBoard from the nonFitted list and places it on all fitting freeBoards (rotated and non-rotated)
     *
     * @param solution
     * @param targetBoardId
     * @private
     */
    private partialSolve(solution: Solution, targetBoardId: number): Solution[] {
        let targetBoardIdx = solution.nonFittedBoards.findIndex(b => b.id == targetBoardId)
        let newNonFitted = [...solution.nonFittedBoards]
        let targetBoard = newNonFitted.splice(targetBoardIdx, 1)[0] //works inplace, returns spliced
        newNonFitted.forEach(b => b.rotated = false)

        if (targetBoard == undefined) {
            logError("Target Board " + targetBoardId + ' has not been found in nonFittedBoards')
            return []
        }

        return solution.restBoards.map((baseBoard, baseBoardIdx) => {
            let rTargetBoard = targetBoard.copy()
            rTargetBoard.rotated = !rTargetBoard.rotated

            let widthWise = this.splitAlongWidth(baseBoard, targetBoard)
            let heightWise = this.splitAlongHeight(baseBoard, targetBoard)
            let rWidthWise = this.splitAlongWidth(baseBoard, rTargetBoard)
            let rHeightWise = this.splitAlongHeight(baseBoard, rTargetBoard)

            let res: Solution[] = []
            let newRest = [...solution.restBoards]
            newRest.splice(baseBoardIdx, 1)
            let baseSolution = new Solution(
                [...solution.fittedBoards],
                newRest,
                [...newNonFitted],
                solution
            )

            if (widthWise != null)
                res.push(
                    baseSolution.copy().appendRestBoards(...widthWise).appendFittedBoards(targetBoard)
                )
            if (heightWise != null)
                res.push(
                    baseSolution.copy().appendRestBoards(...heightWise).appendFittedBoards(targetBoard)
                )
            if (rWidthWise != null)
                res.push(
                    baseSolution.copy().appendRestBoards(...rWidthWise).appendFittedBoards(rTargetBoard)
                )
            if (rHeightWise != null)
                res.push(
                    baseSolution.copy().appendRestBoards(...rHeightWise).appendFittedBoards(rTargetBoard)
                )

            return res
        }).flat()
    }

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
    private splitAlongWidth(baseBoard: Board, targetBoard: Board): Board[] {
        let [tWidth, tHeight] = !targetBoard.rotated ? [targetBoard.width, targetBoard.height] : [targetBoard.height, targetBoard.width]
        let newHeight = baseBoard.height - tHeight
        let newWidth = baseBoard.width - tWidth

        if (newWidth < 0 || newHeight < 0)
            return null

        let rightBoard = new Board(newWidth, targetBoard.height)
        rightBoard.rightOf(targetBoard)

        let lowerBoard = new Board(baseBoard.width, newHeight)
        lowerBoard.belowOf(targetBoard)

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
    private splitAlongHeight(baseBoard: Board, targetBoard: Board): Board[] {
        let [tWidth, tHeight] = !targetBoard.rotated ? [targetBoard.width, targetBoard.height] : [targetBoard.height, targetBoard.width]
        let newHeight = baseBoard.height - tHeight
        let newWidth = baseBoard.width - tWidth

        let rightBoard = new Board(newWidth, baseBoard.height)
        rightBoard.rightOf(targetBoard)

        let lowerBoard = new Board(newWidth, newHeight)
        lowerBoard.belowOf(targetBoard)

        return [rightBoard, lowerBoard].filter(b => b.width > 0 && b.height > 0)
    }

}
