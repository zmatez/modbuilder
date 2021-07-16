//---- MAIN ------------------------------------------------------------------------------------------------------------
const MainController = require('../../../init/controller_main.js');
class MCImport extends MainController{
    listenerOpenChooser;
    listenerOpenMain;//cancel
    listenerFormResult;

    getName() {
        return "import";
    }

    onOpen(data) {
        /**
         * @param event {IpcMainEvent}
         */
        this.listenerOpenChooser = (event) => {
            dialog.showOpenDialog({ properties: ['openDirectory'] })
                .then((result) => {
                    if(result == null || result.filePaths == null || result.filePaths[0] == null){
                        return
                    }
                    let fPath = path.normalize(result.filePaths[0]);
                    fs.readdir(fPath,(err, files) => {
                        if(!err){
                            let contains = false;
                            for (let file of files) {
                                if(file === 'modbuilder.json'){
                                    contains = true;
                                }
                            }

                            if(!contains){
                                ModalController.create("info",{
                                    icon: 'error-mark.svg',
                                    title: "Cannot import mod",
                                    text: "Mod's files not found (modbuilder.json)"
                                });
                            }else{
                                fs.readFile(fPath + "/modbuilder.json",'utf-8',(err, data) => {
                                    if(err){
                                        ModalController.create("info",{
                                            icon: 'error-mark.svg',
                                            title: "Error reading file",
                                            text: err.message
                                        });
                                    }else{
                                        let json = JSON.parse(data);

                                        //check if mod isn't already imported
                                        for (let key in cfg.modData) {
                                            let value = cfg.modData[key];
                                            if(value.path === fPath){
                                                ModalController.create("info",{
                                                    icon: 'error-mark.svg',
                                                    title: "Mod Duplicate",
                                                    text: "This mod is already imported"
                                                });
                                                return
                                            }else if(value.name === json['name']){
                                                ModalController.create("info",{
                                                    icon: 'error-mark.svg',
                                                    title: "Mod Duplicate Name",
                                                    text: "Mod with that name already exists"
                                                });
                                                return
                                            }
                                        }

                                        event.reply('forms:chooser', {
                                            path: fPath,
                                            name: json['name'],
                                            codename: json['codename']
                                        });
                                    }
                                })
                            }
                        }else{
                            ModalController.create("info",{
                                icon: 'error-mark.svg',
                                title: "Error reading directory",
                                text: err.message
                            });
                        }
                    })
                });
        }

        ipc.on('forms:chooser',this.listenerOpenChooser);

        this.listenerOpenMain = (event) => {
            manager.create(new AppWindow('Start','index.html'))
                .withProp('resizable',false)
                .open('index');
        }

        ipc.on('open:main', this.listenerOpenMain)

        this.listenerFormResult = (event, data) => {
            LOG.debug("Received " + JSON.stringify(data));

            cfg.importModData(data['path'], (modData) => {

            })
        }

        ipc.on('forms:result',this.listenerFormResult);
    }

    onClose() {
        ipc.removeListener('forms:chooser',this.listenerOpenChooser);
        ipc.removeListener('open:main',this.listenerOpenMain);
        ipc.removeListener('forms:result',this.listenerFormResult);
    }
}

module.exports = new MCImport();
//----------------------------------------------------------------------------------------------------------------------