<script lang="ts">
    import {Board} from "../types/Board";
    import {boards} from "../stores/Boards";

    export let id: number = -2

    let board: Board = boards.get(id)

    function more() {
        board.amount++
        boards.update(board)
    }

    function less() {
        board.amount = Math.max(0, --board.amount)
        boards.update(board)
    }
</script>

<div class="board input-group mb-3" >

    <div class="title input-group-text">{board.shortName}</div>
    <div class="dimensions input-group-sm input-group-text form-control">{board.dimensions}</div>
    <button class="input-group-sm input-group-append"  on:click={() => less()}>-</button>
    <div class="amount input-group-sm input-group-text">{board.amount}</div>
    <button class="input-group-sm input-group-append" on:click={() => more()}>+</button>
</div>