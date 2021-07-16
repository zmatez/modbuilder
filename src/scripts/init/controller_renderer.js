/**
 * @interface
 */
class RendererController{
    /**
     * @type {{channel: string, event: function({})}[]}
     */
    receiveEvents = [];

    /**
     * @param data {any | null}
     */
    open(data){
        LOG.debug("[RENDERER] Opening " + this.getName());
        api.send('controller:ready','');
        this.onOpen(data);
    }

    close(){
        LOG.debug("[RENDERER] Closing " + this.getName());
        this.onClose();
        for (let receiveEvent of this.receiveEvents) {
            api.removeListener(receiveEvent.channel, receiveEvent.event);
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
    /**
     * @param channel {string}
     * @param data {string}
     * @return {*}
     */
    sendMessage(channel, data){
        return api.send(channel, data);
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
        api.receive(channel, callback);
    }
}
module.exports.RendererController = RendererController;

/**
 * @interface
 */
class RendererAdapter{
    /**
     * @type string
     */
    path;

    /**
     * @abstract
     * @return string
     */
    getName(){

    }

    /**
     * @param ipc {IpcMain}
     */
    send(ipc){

    }
}

module.exports.RendererAdapter = RendererAdapter;
