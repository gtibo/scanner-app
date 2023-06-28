<script>
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { edited_flipbook } from "$lib/store.js";
    import { request_path } from "$lib/request_path";
    import FlipbookItem from '$lib/flipbook_item.svelte';

    let flipbooks = [];
    let flipbook_request = null;
    
    let flipbook_creation_dialog = null;
        
    onMount(()=>{
        flipbook_request = fetchFlipbooks();
    });

    async function fetchFlipbooks(){
        flipbooks = [];
        let request = await fetch(`${request_path}flipbook/all`, {credentials: "include"});
        flipbooks = await request.json();
    }

    async function requestFLipbookCreation(){
        let request = await fetch(`${request_path}flipbook`, { method: "POST", credentials: "include"} );
        let { id } = await request.json();
        openAnimator(id);
    }

    function openAnimator(id){
        edited_flipbook.set(id);
        goto("./animator");
    }

    function editFlipbookName(id, edited_name){
        fetch(`${request_path}flipbook/${id}`, {
            method:"put", 
            body: JSON.stringify({name:edited_name}),
            headers: {
                "Content-Type": "application/json"
            },
        });
    }

    async function deleteFlipbook(id){
        let request = await fetch(`${request_path}flipbook/${id}`, {
            method:"delete", 
            headers: {
                "Content-Type": "application/json"
            },
        });
        
        if(!request.ok) return;
        
        var array_id = flipbooks.indexOf(flipbooks.find(f=>f.id == id));
        if(array_id == -1) return;
        flipbooks.splice(array_id, 1);
        flipbooks = flipbooks;
    }

</script>

<main class="absolute inset-0 flex flex-col gap-6 p-4 overflow-scroll">
    <div class="flex-1">
    {#await flipbook_request}
        <p>Chargement des flipbooks...</p>
    {:then}
        {#if flipbooks.length > 0}
            <div class="flex flex-col gap-4">
                {#each flipbooks as flipbook (flipbook.id)}
                    <FlipbookItem 
                    thumbnail={flipbook.thumbnail ? new URL(flipbook.thumbnail.path, request_path).href : undefined}
                    name={flipbook.name}
                    on:nameEdit = {(e)=>{editFlipbookName(flipbook.id, e.detail)}}
                    on:open = {()=>{openAnimator(flipbook.id)}}
                    on:remove = {(e)=>{
                        let removePromise = deleteFlipbook(flipbook.id);
                        e.detail.callback(removePromise);
                    }}
                    />
                {/each}
            </div>
        {:else}
            <p>Cet espace est vide.</p>
        {/if}
    {/await}
    </div>

    <dialog bind:this={flipbook_creation_dialog} class="border-2 border-black rounded-lg p-0">
        <div class="m-4">
            <p>Création d'un flipbook.</p>
        </div>
    </dialog>

    <button 
        class="sticky bottom-0
        self-center
        text-white bg-black/90 px-3 py-2 rounded font-bold
        flex gap-2 items-center
        "
        on:click={()=>{
            flipbook_creation_dialog.showModal();
            requestFLipbookCreation();
        }}>
        <svg class="stroke-white" width="12" height="12" viewBox="0 0 10 11" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 0.5V5.5M5 5.5V10.5M5 5.5H10M5 5.5L0 5.5" stroke-width="2"/>
        </svg>
        <span>Créer un flipbook</span>
    </button>
</main>