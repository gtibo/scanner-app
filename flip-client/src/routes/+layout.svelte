<svelte:head>
  <title>Tada-Snap</title>
  <script src="opencv.js"></script>
</svelte:head>

<script>
  import "../app.postcss";
  import Scanner from "$lib/scanner.svelte";
  import { scanner_store } from "$lib/store.js";
  import { onMount } from "svelte";

  let appReady = false;

  onMount(()=>{
    appReady = true;
  });

</script>

{#if appReady}

  <slot />

  {#if $scanner_store.active}
    <div class="absolute inset-0 bg-white">
      <Scanner></Scanner>
    </div>
  {/if}
{/if}
