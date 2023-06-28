import { writable } from 'svelte/store';

function createScan() {
    const {
      subscribe,
      set,
      update
    } = writable({
        active: false,
        callback: null
    });
  
    return {
        promise:null,
        subscribe,
        cancel: () => {
            set({
                active: false,
                callback: null
            });
        },
        launch: (callback) => {
            set({
                active: true,
                callback: callback
            });
        },
        confirm: (value) => {
            update(n=>{
                if (n.callback != null) n.callback(value);
                return {
                    active: false,
                    callback: null
                }
            });
        }
    };
  }

export const edited_flipbook = writable(null);

export const SCAN_OPTION_CROPDRAWING = writable(true);

export const scanner_store = createScan();