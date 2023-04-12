<script lang="ts">
    import {boards} from "../stores/Boards";
    import {DepthSolver} from "../stores/solvers/DepthSolver";
    import type {BaseSolver} from "../stores/solvers/BaseSolver";
    import {SolverConfiguration} from "../types/SolverConfiguration";
    import type {SolverResult} from "../types/SolverResult";

    let _boards

    let colors = []
    let solver: BaseSolver = null
    let solverConfiguration = new SolverConfiguration()
    let inpBladeWidth = solverConfiguration.bladeWidth
    let solverPaused: boolean = false;
    let solverResult: SolverResult = null
    let finishedNumber: number = 0
    let failedNumber: number = 0
    let partialNumber: number = 0

    let solutionIdx: number = 0

    let previousAllowed = false
    let nextAllowed = false


    boards.subscribe(b => {
        _boards = b

        if (colors.length < _boards.targetBoards.length)
            for (let i = 0; i < _boards.targetBoards.length - colors.length; i++)
                colors.push('rgb('
                    + Math.round(Math.random() * 255) + ','
                    + Math.round(Math.random() * 255) + ','
                    + Math.round(Math.random() * 255) + ')'
                )

        if (solver) {
            solver.cancel()
        }

        solver = new DepthSolver(solverConfiguration)
        solver.subscribe(r => {
            if (!r)
                return

            solverResult = r
            if (r.solutions.length > 0)
                nextAllowed = true
            else {
                previousAllowed = false
                nextAllowed = false
            }

            finishedNumber = r.finishedSolutions.length
            partialNumber = r.solutions.length - finishedNumber
            failedNumber = r.finishedSolutions.filter(s => s.failed).length

            checkPrevNext()
        })

        solver.paused.subscribe(v => solverPaused = v);

        solver.startSolver(_boards.baseBoard, _boards.targetBoards)
    })


    function nextSolution() {
        if (++solutionIdx > solverResult.solutions.length - 1)
            solutionIdx = solverResult.solutions.length - 1

        checkPrevNext()
    }

    function prevSolution() {
        if (--solutionIdx < 0)
            solutionIdx = 0

        checkPrevNext()
    }

    function checkPrevNext() {
        if (solutionIdx > solverResult.solutions.length - 1)
            solutionIdx = solverResult.solutions.length - 1

        previousAllowed = (solutionIdx > 0)
        nextAllowed = (solutionIdx < solverResult.solutions.length - 1)
    }

    function resumeSolver() {
        solver.resumeSolving()
    }

    function pauseSolver() {
        solver.pauseSolving()
    }

    function restartSolver() {
        solverConfiguration.bladeWidth = +inpBladeWidth
        solver.startSolver(_boards.baseBoard, _boards.targetBoards)
    }
</script>

<div class="chartjs-size-monitor">
    <div class="chartjs-size-monitor-expand">
        <div class=""></div>
    </div>
    <div class="chartjs-size-monitor-shrink">
        <div class=""></div>
    </div>
</div>
<div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
    <h1 class="h2">Solution {solutionIdx + 1} (
        Score: {solverResult ? solverResult.solutions[solutionIdx].score : 0}
        {solverResult && solverResult.solutions[solutionIdx].failed ? ", FAILED!" : ""}
        {solverResult && !solverResult.solutions[solutionIdx].finished ? ", Partial!" : ""}
        )</h1>
    {#if (solverPaused)}
        <small>Paused solver (probably best solution already found) ({partialNumber} partial, {finishedNumber}
            finished, {failedNumber} of them failed)
            <button on:click={() => resumeSolver()}>Resume</button>
        </small>
    {:else }
        <small>Finding solutions ({partialNumber} partial, {finishedNumber} finished, {failedNumber} of them failed)
            <button on:click={() => pauseSolver()}>Pause</button>
        </small>
    {/if}
    <div class="btn-toolbar mb-2 mb-md-0">
        <div class="btn-group me-2">
            <button type="button"
                    class="btn btn-sm btn-outline-secondary {(!previousAllowed) ? "disabled" : ""} " on:click={() => prevSolution()}>Previous
            </button>
            <button type="button"
                    class="btn btn-sm btn-outline-secondary {(!nextAllowed) ? "disabled" : ""}" on:click={() => nextSolution()}>Next
            </button>
        </div>
    </div>
</div>

<svg viewBox="-1 -1 {_boards.baseBoard.width + 2} {_boards.baseBoard.height + 2}">
    <rect fill="rgba(255,200,200,1)" height="{_boards.baseBoard.height + 2}" stroke="black"
          width="{_boards.baseBoard.width + 2}"
          x="-1" y="-1"
          stroke-width="2"></rect>
    {#if solverResult && solverResult.solutions.length > 0 }
        {#each solverResult.solutions[solutionIdx].restBoards as board, i}
            <rect x="{board.x}" y="{board.y}" width="{board.width}" height="{board.height}"
                  fill="rgba(200,200,200,1)"></rect>
            <text x="{board.x + board.width / 8}" y="{board.y +board.height / 8 + 20}"
                  font-size={Math.min(board.height/8, board.width / 8)}>{board.dimensions}</text>
        {/each}
        {#each solverResult.solutions[solutionIdx].fittedBoards as board, i}
            <g>
                <rect x="{board.x}" y="{board.y}" width="{board.width}" height="{board.height}" fill="white"
                      stroke="{colors[i]}"
                      stroke-width="1"></rect>
                <text x="{board.x + board.width / 3}" y="{board.y +board.height / 3 }"
                      font-size={Math.min(board.height/6, board.width / 6)}>{board.groupId}{board.rotated ? " (r)" : ""}</text>
                <text x="{board.x + board.width / 3}" y="{board.y +board.height / 3 + board.height/8}"
                      font-size={Math.min(board.height/8, board.width / 8)}>{board.dimensions}</text>
            </g>
        {/each}
    {/if}
</svg>

<h2>Settings</h2>
<div class="table-responsive">
    <table class="table table-striped table-sm">
        <thead>
        <tr>
            <th scope="col">Key</th>
            <th scope="col">Value</th>
        </tr>
        </thead>
        <tbody>
        <tr>
            <td>Blade Width</td>
            <td><input bind:value={inpBladeWidth} type="text"/></td>
        </tr>
        <tr>
            <td>Rotation allowed</td>
            <td><input bind:checked={solverConfiguration.rotationAllowed} type="checkbox"/></td>
        </tr>
        <tr>
            <td>
                <button on:click={()=>restartSolver()}>Apply</button>
            </td>
        </tr>
        </tbody>
    </table>
</div>
<!--
<h2>Section title</h2>
<div class="table-responsive">
    <table class="table table-striped table-sm">
        <thead>
        <tr>
            <th scope="col">#</th>
            <th scope="col">Header</th>
            <th scope="col">Header</th>
            <th scope="col">Header</th>
            <th scope="col">Header</th>
        </tr>
        </thead>
        <tbody>
        <tr>
            <td>1,001</td>
            <td>random</td>
            <td>data</td>
            <td>placeholder</td>
            <td>text</td>
        </tr>
        <tr>
            <td>1,002</td>
            <td>placeholder</td>
            <td>irrelevant</td>
            <td>visual</td>
            <td>layout</td>
        </tr>
        <tr>
            <td>1,003</td>
            <td>data</td>
            <td>rich</td>
            <td>dashboard</td>
            <td>tabular</td>
        </tr>
        <tr>
            <td>1,003</td>
            <td>information</td>
            <td>placeholder</td>
            <td>illustrative</td>
            <td>data</td>
        </tr>
        <tr>
            <td>1,004</td>
            <td>text</td>
            <td>random</td>
            <td>layout</td>
            <td>dashboard</td>
        </tr>
        <tr>
            <td>1,005</td>
            <td>dashboard</td>
            <td>irrelevant</td>
            <td>text</td>
            <td>placeholder</td>
        </tr>
        <tr>
            <td>1,006</td>
            <td>dashboard</td>
            <td>illustrative</td>
            <td>rich</td>
            <td>data</td>
        </tr>
        <tr>
            <td>1,007</td>
            <td>placeholder</td>
            <td>tabular</td>
            <td>information</td>
            <td>irrelevant</td>
        </tr>
        <tr>
            <td>1,008</td>
            <td>random</td>
            <td>data</td>
            <td>placeholder</td>
            <td>text</td>
        </tr>
        <tr>
            <td>1,009</td>
            <td>placeholder</td>
            <td>irrelevant</td>
            <td>visual</td>
            <td>layout</td>
        </tr>
        <tr>
            <td>1,010</td>
            <td>data</td>
            <td>rich</td>
            <td>dashboard</td>
            <td>tabular</td>
        </tr>
        <tr>
            <td>1,011</td>
            <td>information</td>
            <td>placeholder</td>
            <td>illustrative</td>
            <td>data</td>
        </tr>
        <tr>
            <td>1,012</td>
            <td>text</td>
            <td>placeholder</td>
            <td>layout</td>
            <td>dashboard</td>
        </tr>
        <tr>
            <td>1,013</td>
            <td>dashboard</td>
            <td>irrelevant</td>
            <td>text</td>
            <td>visual</td>
        </tr>
        <tr>
            <td>1,014</td>
            <td>dashboard</td>
            <td>illustrative</td>
            <td>rich</td>
            <td>data</td>
        </tr>
        <tr>
            <td>1,015</td>
            <td>random</td>
            <td>tabular</td>
            <td>information</td>
            <td>text</td>
        </tr>
        </tbody>
    </table>
</div>
-->
