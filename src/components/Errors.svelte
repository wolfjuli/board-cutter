<script lang="ts">
    import {errors} from "../stores/Errors";

    let _errors
    errors.subscribe((e) => {
        _errors = e
    })

</script>

{#each errors as error}

{/each}