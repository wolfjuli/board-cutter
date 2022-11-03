<script lang="ts">
    import type {Error} from "../stores/Errors";
    import {errors} from "../stores/Errors";

    let _errors: Error[]
    errors.subscribe((e) => {
        _errors = e.sort((a, b) => b.created - a.created)
    })

</script>

{#each _errors as error}
    <div class="alert alert-danger alert-dismissible fade show" role="alert">
        {error.message}
        <div class="progress">
            <div class="progress-bar bg-danger" role="progressbar" style="width: {error.progress}%" aria-valuenow="{error.progress}" aria-valuemin="0" aria-valuemax="5000"></div>
        </div>
    </div>
{/each}