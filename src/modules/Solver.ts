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

export class Solution {

    public score: number = -1

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

export class SolverConfiguration {
    constructor(
        public rotationAllowed: Boolean = true
    ) {

    }

}

export class Solver {

    public solutions: Solution[] = []


    constructor(baseBoard: Board, targetBoards: Board[], public configuration: SolverConfiguration = new SolverConfiguration()) {
        if (targetBoards.length > 0) {
            this.solutions = this.solve(baseBoard, targetBoards)
        } else
            logDebug("targetBoards is empty")
    }

    private solve(baseBoard: Board, targetBoards: Board[]): Solution[] {

        let allTargetBoards: Board[] = targetBoards.map(b => {
            return Array.from({length: b.amount}, () => b.copy())
        }).flat()

        let allSolutions: Solution[] = []
        let partialSolutions: Solution[] = [new Solution(
            [],
            [baseBoard],
            allTargetBoards
        )]

        logDebug("Start solving:", partialSolutions)

        try {
            let counter = 0
            while (partialSolutions.length > 0) {
                allSolutions.push(...partialSolutions)
                partialSolutions = partialSolutions.map(solution => {
                    return solution.nonFittedBoards.map((b) => {
                        return this.partialSolve(solution, b.id)
                    }).flat()
                }).flat()

                if (counter++ > 20) {
                    logError("Too many steps")
                    return allSolutions.filter(s => parents.indexOf(s) == -1)
                }
            }
        } catch (e) {
            logError("Error during solving: ", e)
        }

        let parents = allSolutions.map(s => s.parentSolution)
        let result = allSolutions.filter(s => parents.indexOf(s) == -1)

        this.scoreSolutions(result)

        result = result.sort((a, b) => b.score - a.score)
        logDebug("Solutions", result)
        return result
    }

    /***
     * FScores a solution:
     * Amount of rest: * -1 (better few big boards than a lot of small ones)
     * Area of the biggest rest: * 10
     * Longest length of rest: *1
     * Every rotation: * -1
     * Not fitting boards: area * -10
     *
     * @param solutions
     * @private
     */
    private scoreSolutions(solutions: Solution[]) {
        solutions.forEach(s => {
            let biggest = s.restBoards.sort((a, b) => b.area - a.area)[0]
            let longest = s.restBoards.sort((a, b) => b.longestSide - a.longestSide)[0]
            s.score =
                s.restBoards.length * -1 +
                biggest.area * 10 +
                longest.longestSide +
                s.fittedBoards.reduce((acc, curr) => acc - (curr.rotated ? 1 : 0), 0) +
                s.nonFittedBoards.reduce((acc, curr) => acc + curr.area * -10, 0)
        })
    }

    /***
     * Removes the given targetBoard from the nonFitted list and places it on all fitting freeBoards (rotated and non-rotated)
     *
     * @param solution
     * @param targetBoardId
     * @private
     */
    private partialSolve(solution: Solution, targetBoardId: number): Solution[] {
        let targetBoardIdx = solution.nonFittedBoards.findIndex(b => b.id === targetBoardId)
        let newNonFitted = [...solution.nonFittedBoards] //splice next line removes the board
        let targetBoard = newNonFitted.splice(targetBoardIdx, 1)[0] //works inplace, returns spliced
        newNonFitted.forEach(b => b.rotated = false)

        if (targetBoard == undefined) {
            logError("Target Board " + targetBoardId + ' has not been found in nonFittedBoards')
            return []
        }

        return solution.restBoards.map((baseBoard, baseBoardIdx) => {
            let rTargetBoard = targetBoard.copy()
            rTargetBoard.rotated = !rTargetBoard.rotated

            let rotate = this.configuration.rotationAllowed && targetBoard.width !== targetBoard.height

            logDebug("BaseBoard", baseBoard)

            targetBoard.x = baseBoard.x
            targetBoard.y = baseBoard.y

            let widthWise = this.splitWidthFirst(baseBoard, targetBoard)
            let heightWise = this.splitHeightFirst(baseBoard, targetBoard)
            let rWidthWise = rotate ? this.splitWidthFirst(baseBoard, rTargetBoard) : null
            let rHeightWise = rotate ? this.splitHeightFirst(baseBoard, rTargetBoard) : null

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
                    baseSolution.copy().appendRestBoards(...widthWise).appendFittedBoards(targetBoard.copy())
                )

            if (heightWise != null)
                res.push(
                    baseSolution.copy().appendRestBoards(...heightWise).appendFittedBoards(targetBoard.copy())
                )
            if (rWidthWise != null)
                res.push(
                    baseSolution.copy().appendRestBoards(...rWidthWise).appendFittedBoards(rTargetBoard.copy())
                )
            if (rHeightWise != null)
                res.push(
                    baseSolution.copy().appendRestBoards(...rHeightWise).appendFittedBoards(rTargetBoard.copy())
                )

            logDebug("Calculated result", res)
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
    private splitWidthFirst(baseBoard: Board, targetBoard: Board): Board[] {
        let [tWidth, tHeight] = !targetBoard.rotated ? [targetBoard.width, targetBoard.height] : [targetBoard.height, targetBoard.width]
        let newHeight = baseBoard.height - tHeight
        let newWidth = baseBoard.width - tWidth

        if (newWidth < 0 || newHeight < 0)
            return null

        let rightBoard = new Board(newWidth, tHeight)
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
    private splitHeightFirst(baseBoard: Board, targetBoard: Board): Board[] {
        let [tWidth, tHeight] = !targetBoard.rotated ? [targetBoard.width, targetBoard.height] : [targetBoard.height, targetBoard.width]
        let newHeight = baseBoard.height - tHeight
        let newWidth = baseBoard.width - tWidth

        if (newWidth < 0 || newHeight < 0)
            return null

        let rightBoard = new Board(newWidth, baseBoard.height)
        rightBoard.rightOf(targetBoard)

        let lowerBoard = new Board(tWidth, newHeight)
        lowerBoard.belowOf(targetBoard)

        return [rightBoard, lowerBoard].filter(b => b.width > 0 && b.height > 0)
    }

}
