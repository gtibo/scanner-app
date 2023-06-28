<script>
    import { onMount, onDestroy, tick} from "svelte";
    import { scanner_store, SCAN_OPTION_CROPDRAWING } from "$lib/store.js";
    import { getAPage, cropDrawing } from "$lib/cv_methods";

    import { request_path } from "$lib/request_path";

    let cv_capture = undefined;
    let cv_src = undefined;
    
    let preview_video;
    let canvasOutput;
    
    let camera_ready = false;

    let upload_dialog;

    let has_valid_image = false;

    const constraints = {
        audio: false,
        video: { 
            width: 1280, 
            height: 1280, 
            facingMode: 'environment' 
        }
    };
    
    onMount(()=>{
        navigator.mediaDevices.getUserMedia(constraints).then((mediaStream) => {
        preview_video.srcObject = mediaStream;

        let settings = mediaStream.getVideoTracks()[0].getSettings();

        preview_video.width = settings.width;
        preview_video.height = settings.height;

        preview_video.onloadedmetadata = () => {
            if(!preview_video) return;
            preview_video.play();
            cv_src = new cv.Mat(settings.height, settings.width, cv.CV_8UC4);
            cv_capture = new cv.VideoCapture(preview_video);
            camera_ready = true;
        };
    })
    .catch((err) => {
        console.error(`${err.name}: ${err.message}`);
    });

    });

    onDestroy(()=>{
        if(preview_video.srcObject == null) return;
        preview_video.srcObject.getTracks().forEach(track => track.stop())
    });


    function processVideo() {
        return new Promise((res,rej)=>{
            try {
                let begin = Date.now();
                // start processing.
                cv_capture.read(cv_src);
                
                let result = getAPage(cv_src);

                if(result && $SCAN_OPTION_CROPDRAWING) {
                    let last_result = result;
                    result = cropDrawing(last_result);
                    last_result.delete();
                };
                
                if(result) {
                    cv.imshow(canvasOutput, result);
                    result.delete();
                };
                has_valid_image = true;
                res();
            } catch (err) {
                console.log(err);
            }
            rej();
        });
    };            

    let searching = false;

    async function scan(){
        searching = true;
        await new Promise(res=>setTimeout(res, 10));
        processVideo().then(()=> searching = false);
    }

    async function uploadCanvas(){
        let blob = await new Promise((res)=>{
            canvasOutput.toBlob((blob)=>{
                res(blob);
            });
        });

        let formData = new FormData();
        formData.append('picture', blob);

        let upload_response = await fetch(`${request_path}image`, {
            body: formData,
            method: "post"
        });

        if(upload_response.ok == false){
            let res = await upload_response.text();
            console.error(res);
            return;
        }
        
        let ImageData = await upload_response.json();
        
        scanner_store.confirm(ImageData);        
    }

</script>

<dialog bind:this={upload_dialog}>
    <div>
        Enregistrement de l'image.
    </div>
</dialog>

<div class="absolute inset-0 flex flex-col gap-4 overflow-hidden p-3">
    <header class="flex justify-between items-center">
        <button on:click={scanner_store.cancel}>
            <svg class="w-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path xmlns="http://www.w3.org/2000/svg" d="M6 10H14C16.2091 10 18 11.7909 18 14V14C18 16.2091 16.2091 18 14 18H10.6154M6 10L9 7M6 10L9 13" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </button>
        <h4 class="font-bold">Scanner</h4>
    </header>
    <div class="relative flex-1">
        <canvas class="absolute w-full h-full object-contain border-3 border-black rounded-lg" bind:this={canvasOutput} id="canvasOutput">
        </canvas>
    </div>
    <section class="flex justify-between items-center">
        <div>
            <input type="checkbox" id="crop-drawing-checkbox" bind:checked={$SCAN_OPTION_CROPDRAWING}>
            <label for="crop-drawing-checkbox">
                Découper le dessin
            </label>
        </div>
        
        <button class="tool-btn" on:click={()=>{
            upload_dialog.showModal();
            uploadCanvas();}} disabled={!has_valid_image}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 6C4 4.34315 5.34315 3 7 3H17L20 6V18C20 19.6569 18.6569 21 17 21H7C5.34315 21 4 19.6569 4 18V6Z" stroke="black" stroke-width="2" stroke-linejoin="round"/>
                <path d="M8 3V8H16V3" stroke="black" stroke-width="2" stroke-linejoin="round"/>
                <path d="M16 18V13H8V18H16Z" stroke="black" stroke-width="2" stroke-linejoin="round"/>
            </svg>
        </button>
    </section>

    <div class="flex justify-between gap-2">
        <video bind:this={preview_video} style="width:40%; height:auto;"></video>
        <button 
        class="p-4 border-black border-3 rounded-lg flex-1 text-lg font-bold"
        on:click={scan} disabled={!camera_ready || searching}>
            Capturer
        </button>
    </div>
</div>

<style>
    .tool-btn{
        @apply border-3 border-black aspect-square w-12 p-2 rounded-lg;
    }
    input, button{
        @apply disabled:opacity-40;
    }
</style>