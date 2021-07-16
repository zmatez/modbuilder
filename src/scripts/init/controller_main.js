/**
 * @interface
 */
class MainController{
    /**
     * @private
     */
    listenerControllerReady;

    /**
     * @type {IpcMainEvent}
     */
    localIPC;

    /**
     * @type {{channel: string, event: function({})}[]}
     */
    receiveEvents = [];

    /**
     * @param data {any | null}
     */
    open(data){
        LOG.debug("[MAIN] Opening " + this.getName());
        this.listenerControllerReady = (event, data_) => {
            this.localIPC = event;
            this.onOpen(data);
            ipc.removeListener('controller:ready',this.listenerControllerReady);
            this.listenerControllerReady = null;
        }

        ipc.on('controller:ready',this.listenerControllerReady);
    }

    close(){
        LOG.debug("[MAIN] Closing " + this.getName());
        this.onClose();
        if(this.listenerControllerReady != null){
            ipc.removeListener('controller:ready',this.listenerControllerReady);
        }
        for (let receiveEvent of this.receiveEvents) {
            ipc.removeListener(receiveEvent.channel, receiveEvent.event);
        }
    }

    /**
     * @abstract
     * @param data {any | null}
     */
    onOpen(data){

    }

    /**
     * @abstract
     */
    onClose(){

    }

    /**
     * @abstract
     * @return string
     */
    getName(){
        return "undefined";
    }

    //------------------
    sendMessage(channel, data){
        return this.localIPC.reply(channel, data);
    }

    /**
     * @param channel {string}
     * @param callback {function(data: *)}
     */
    receive(channel, callback){
        this.receiveEvents.push({
            channel: channel,
            event: callback
        })
        ipc.on(channel, callback);
    }
}

module.exports = MainController;