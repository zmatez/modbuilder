//---- MAIN ------------------------------------------------------------------------------------------------------------
const MainController = require('../../../init/controller_main.js');
class MCIndex extends MainController{
    listenerOpenCreate;
    listenerOpenImport;
    listenerLoadMods;
    listenerFuncOpen;
    listenerFuncRemove;

    getName() {
        return "index";
    }

    onOpen(data) {
        this.listenerOpenImport = (data) => {
            manager.create(new AppWindow('Import','import.html'))
                .withProp('resizable',false)
                .open('import');
        };

        ipc.on('open:import',this.listenerOpenImport);

        this.listenerOpenCreate = (data) => {
            manager.create(new AppWindow('Create','create.html'))
                .withProp('resizable',false)
                .open('create');
        };

        ipc.on('open:create',this.listenerOpenCreate);

        /**
         * @param event {IpcMainEvent}
         */
        this.listenerLoadMods = (event) => {
            LOG.debug("Loading mods...")
            let interval = setInterval(() => {
                if(cfg.loaded){
                    let modsData = {};
                    for (let key in cfg.modData) {
                        let value = cfg.modData[key];
                        modsData[key] = {
                            name: value.name,
                            codename: value.codename,
                            path: value.path
                        }
                    }

                    LOG.debug("Mods sent: " + JSON.stringify(modsData))

                    event.reply('data:mods',modsData);
                    clearInterval(interval);
                }
            }, 100);
        }

        ipc.on('load:mods', this.listenerLoadMods);

        this.listenerFuncOpen = (event,data) => {
            manager.create(new AppWindow('Creator - ' + data.name,'creator.html'))
                .withProp('maximized',true)
                .withProp('width',1280)
                .withProp('height',720)
                .open('creator', data);
        }

        ipc.on('func:open', this.listenerFuncOpen);

        this.listenerFuncRemove = (event,data) => {
            cfg.removeModData(data);
            this.listenerLoadMods(event);
        }

        ipc.on('func:remove', this.listenerFuncRemove);
    }

    onClose() {
        ipc.removeListener('open:create',this.listenerOpenCreate);
        ipc.removeListener('open:import',this.listenerOpenImport);
        ipc.removeListener('load:mods',this.listenerLoadMods);
        ipc.removeListener('func:open',this.listenerFuncOpen);
        ipc.removeListener('func:remove',this.listenerFuncRemove);

    }
}

module.exports = new MCIndex();
//----------------------------------------------------------------------------------------------------------------------