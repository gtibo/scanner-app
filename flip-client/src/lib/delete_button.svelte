<script>
    let active = false;
    let processing = false;

    function mainClick(){
        if(!active){
            active = true;
            return;
        }
        processing = true;

    }

    function reset(){
        active = false;
        processing = false;
    }

</script>

<div class="wrap">
    {#if processing}
        <div class="self-center p-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 animate-spin">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
        </div>
    {:else}
        <button class:flex-1={!active} class="flex gap-2" on:click={mainClick}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
            {#if active}
            <div>Supprimer</div>
            {/if}
        </button>

        {#if active}
            <button class="flex-1 border-l-2 border-black" on:click={reset}>Annuler</button>
        {/if}
    {/if}
</div>

<style>
    .wrap{
        @apply border-2 border-black flex justify-center;
    }
    button{
        @apply px-4 py-2 flex justify-center;
    }
</style>