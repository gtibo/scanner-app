<script>
    import { goto } from "$app/navigation";
    import { edited_flipbook } from "$lib/store.js";
    import { scanner_store } from "$lib/store.js";
    import { onMount } from "svelte";
    import { request_path } from "$lib/request_path";

    let 
    name = "",
    frames = [],
    selected_frame_index = undefined,
    frames_map = {},
    fps = 12;

    let fps_list = [4, 8, 12, 24];

    let playing = false;

    let flipbook_request = null;

    onMount(async()=>{
        if($edited_flipbook == null){
            goto("/");
            return;
        };
        flipbook_request = loadFlipbook();
    });
    

    async function loadFlipbook(){
        let request_url = new URL(`flipbook/${$edited_flipbook}`, request_path).href;
        let request = await fetch(request_url);
        let response = await request.json();
        name = response.name;
        frames = response.frames;
        frames_map = response.frames_map;
        fps = response.fps;
        if(frames.length > 0) selected_frame_index = 0;
    }

    function requestScan(){
        scanner_store.launch((ImageData = {})=>{
            // returns uploaded image data
            frames.push(ImageData.id);
            frames_map[ImageData.id] = ImageData;
            frames = frames;
            editFlipBook($edited_flipbook, {frames});
            if(selected_frame_index == undefined) selected_frame_index = 0;
        });
    }

    function editFlipBook(id, data = {}){
        fetch(`${request_path}flipbook/${id}`, {
            method:"put", 
            body: JSON.stringify(data),
                headers: {
                    "Content-Type": "application/json"
                },
        });
    }

    $: can_move_frame_left = selected_frame_index != undefined && (selected_frame_index - 1) >= 0;
    $: can_move_frame_right = selected_frame_index != undefined && (selected_frame_index + 1) <= frames.length - 1;

    function moveFrame(direction){
        if(frames.length == 0 || playing) return;
        let target_index = selected_frame_index + direction;
        if(target_index < 0) return;
        if(target_index > frames.length - 1) return;

        let frame_id = frames[selected_frame_index];

        frames.splice(selected_frame_index, 1);
        frames.splice(target_index, 0, frame_id);
        frames = frames;
        selected_frame_index = target_index;
        editFlipBook($edited_flipbook, {frames});
    }

    $: can_duplicate_frame = selected_frame_index != undefined;

    function duplicateFrame(){
        if(!can_duplicate_frame || playing) return;
        frames.splice(selected_frame_index, 0, frames[selected_frame_index]);
        frames = frames;
        editFlipBook($edited_flipbook, {frames});
    }

    function deleteFrame(){
        if(selected_frame_index == undefined || playing) return;
        if(!Number.isInteger(selected_frame_index)) return;
        frames.splice(selected_frame_index, 1);
        frames = frames;
        if(selected_frame_index > frames.length - 1) selected_frame_index -=1;
        if(frames.length == 0) selected_frame_index = undefined;
        editFlipBook($edited_flipbook, {frames});
    }

    function closeAnimator(){
        goto("/");
    };

    $: can_toggle_play = frames.length >= 2;

    function togglePlay(){
        if(frames.length <= 1) return;
        if(selected_frame_index == undefined) selected_frame_index = 0;
        playing = !playing;
        if(playing){
            play_interval = setInterval(()=>{
                selected_frame_index += 1;
                if(selected_frame_index > frames.length - 1) selected_frame_index = 0;
            }, 1000 / fps);
        }else{
            clearInterval(play_interval);
        }
    }

    let play_interval = null;

</script>


<main class="absolute inset-0 flex flex-col gap-4 overflow-hidden p-3">

    {#await flipbook_request}
    <p>Chargement du flipbook...</p>
    {:then} 
    <header class="flex justify-between items-center gap-4">
        <button on:click={closeAnimator}>
            <svg class="w-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path xmlns="http://www.w3.org/2000/svg" d="M6 10H14C16.2091 10 18 11.7909 18 14V14C18 16.2091 16.2091 18 14 18H10.6154M6 10L9 7M6 10L9 13" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </button>
        <input class="text-right flex-1 px-4 w-full font-bold" type="text" name="flipbook name" placeholder="Flipbook sans nom" value={name} on:change={(e)=>{editFlipBook($edited_flipbook, {name: e.target.value})}}>
    </header>
    <div class="flex-1 relative border-3 border-black rounded-lg">
        {#if selected_frame_index != undefined}
            {@const frame_id = frames[selected_frame_index]}
            {@const frame_data = frames_map[frame_id]}
            <div 
                style="background-image:url({new URL(frame_data.path, request_path).href});"
                class="absolute inset-0 bg-contain bg-center bg-no-repeat"
            >
            </div>
        {/if}
    </div>
    <footer class="flex flex-col gap-4 items-center">
        <div id="timeline" class="flex w-full w-full snap-mandatory snap-x overflow-x-scroll">
            {#each frames as _i, frame_index}
                {@const frame_id = frames[frame_index]}
                {@const frame_data = frames_map[frame_id]}
                <input id="frame-{frame_index}" 
                disabled={playing}
                type=radio bind:group={selected_frame_index} name="frames" value={frame_index}>
                <label for="frame-{frame_index}"
                class="snap-start shrink-0 w-1/4 h-full flex flex-col items-center gap-2 px-2">
                    <div 
                    class="label-inside"
                    style="background-image: url({new URL(frame_data.path, request_path).href});">
                    </div>
                </label>
            {/each}
        </div>
        <div class="flex gap-2">
    
            <button class="tool-btn" on:click={requestScan} disabled={playing}>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 4L12 20" stroke="black" stroke-width="3" stroke-linecap="round"/>
                    <path d="M20 12L4 12" stroke="black" stroke-width="3" stroke-linecap="round"/>
                </svg>
            </button>
    
            <button class="tool-btn" on:click={()=>{moveFrame(-1)}} disabled={playing || !can_move_frame_left}>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10.4835 10.3615L17.853 5.20285C19.1786 4.27496 21 5.22327 21 6.84131V17.1587C21 18.7767 19.1786 19.725 17.853 18.7972L10.4835 13.6385C9.34605 12.8423 9.34605 11.1577 10.4835 10.3615Z" fill="black"/>
                    <circle cx="5.57143" cy="12" r="2.5" fill="black"/>
                </svg>
            </button>
            
            <button class="tool-btn" on:click={()=>{moveFrame(1)}} disabled={playing || !can_move_frame_right}>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13.5165 10.3615L6.14696 5.20285C4.8214 4.27496 3.00003 5.22327 3.00003 6.84131V17.1587C3.00003 18.7767 4.8214 19.725 6.14696 18.7972L13.5165 13.6385C14.6539 12.8423 14.654 11.1577 13.5165 10.3615Z" fill="black"/>
                    <circle cx="2.57143" cy="2.57143" r="2.5" transform="matrix(-1 0 0 1 21 9.42856)" fill="black"/>
                </svg>
            </button>
            
            <button class="tool-btn" on:click={duplicateFrame} disabled={playing || !can_duplicate_frame}>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="3" width="12" height="12" stroke="black" stroke-linejoin="round" stroke-width="3"/>
                    <rect x="9" y="9" width="12" height="12" stroke="black" stroke-linejoin="round" stroke-width="3"/>
                </svg>
            </button>
            <button class="tool-btn" on:click={deleteFrame} disabled={playing || selected_frame_index == undefined}>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5.48446 20.3501L4 12H20L18.5155 20.3501C18.3458 21.3046 17.5159 22 16.5464 22H7.45358C6.48406 22 5.65416 21.3046 5.48446 20.3501Z" fill="black"/>
                    <path d="M4 8V10H20V8C20 6.89543 19.1046 6 18 6H6C4.89543 6 4 6.89543 4 8Z" fill="black"/>
                    <path d="M8 6V5C8 3.89543 8.89543 3 10 3H14C15.1046 3 16 3.89543 16 5V6" stroke="black" stroke-width="2"/>
                </svg>
            </button>
        </div>
        
        <div class="play-button">
            <select name="fps" bind:value={fps} disabled={playing} on:change={()=>{editFlipBook($edited_flipbook, {fps: fps})}}>
                {#each fps_list as v}
                    <option value={v}>{v}</option>
                {/each}
            </select>
            <button class="" on:click={togglePlay} disabled={!can_toggle_play}>
                {#if !playing}
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.7215 10.3725L9.16248 4.25891C7.83874 3.31339 6 4.25963 6 5.88638V18.1136C6 19.7404 7.83874 20.6866 9.16248 19.7411L17.7215 13.6275C18.8382 12.8298 18.8382 11.1702 17.7215 10.3725Z" fill="black"/>
                </svg>
                {:else}
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="14" y="5" width="4" height="14" rx="2" fill="black"/>
                    <rect x="6" y="5" width="4" height="14" rx="2" fill="black"/>
                </svg>
                {/if}
            </button>
        </div>
    </footer>
    {/await}

</main>

<style>
    .play-button{
        @apply flex border-3 border-black rounded-lg;
    }
    .play-button select{
        @apply bg-black font-bold text-white p-2;
    }
    .play-button button{
        @apply p-2 w-14;
    }
    .tool-btn{
        @apply border-3 border-black aspect-square w-12 p-2 rounded-lg;
    }
    #timeline input[type="radio"]{
        @apply hidden;
    }
    #timeline .label-inside{
        @apply  w-full h-auto aspect-square bg-contain bg-center bg-no-repeat bg-black/5 border-3 border-transparent rounded-lg;
    }
    #timeline input[type="radio"]:checked+label .label-inside {
        @apply border-black;
    }
    input, button{
        @apply disabled:opacity-40;
    }
</style>