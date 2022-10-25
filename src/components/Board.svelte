<script lang="ts">
    import {Board} from "../types/Board";
    import {afterUpdate, beforeUpdate} from "svelte";
    import {boards} from "../stores/Boards";

    export let id: number

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

<div class="board">
    <div class="amount">{board.amount}</div>

    <div class="title">{board.name}</div>
    <div class="dimensions">{board.dimensions}</div>
    <button on:click={() => more()}>^</button>
    <button on:click={() => less()}>v</button>
</div>