//---- MAIN ------------------------------------------------------------------------------------------------------------
const MainController = require('../../../init/controller_main.js');
class MCCreate extends MainController{
    listenerOpenChooser;
    listenerOpenMain;//cancel
    listenerFormResult;

    getName() {
        return "create";
    }

    onOpen(data) {
        /**
         * @param event {IpcMainEvent}
         */
        this.listenerOpenChooser = (event) => {
            dialog.showOpenDialog({ properties: ['openDirectory'] })
                .then((result) => {
                    if(result.filePaths.length > 0) {
                        let fPath = path.normalize(result.filePaths[0]);
                        fs.readdir(fPath, (err, data) => {
                            //check if folders are valid
                            if (!err) {
                                if (data.includes('assets') && data.includes('data')) {
                                    event.reply('forms:chooser', fPath);
                                } else {
                                    let controller = ModalController.create("action",{
                                        icon: 'folder_gradient.svg',
                                        title: "No assets found",
                                        text: "No required folders found. Would you like to create them?",
                                        action1: 'create'
                                    });
                                    controller.onAction('create',(data) => {
                                        fs.mkdir(fPath + "/assets",() => {});
                                        fs.mkdir(fPath + "/data",() => {});

                                        fs.readdir(fPath, (err, data) => {
                                            //check if folders are valid AGAIN
                                            if (!err) {
                                                if (data.includes('assets') && data.includes('data')) {
                                                    event.reply('forms:chooser', fPath);
                                                } else {
                                                    ModalController.create("info",{
                                                        icon: 'error-mark.svg',
                                                        title: "Unable to create resources",
                                                        text: "Try again"
                                                    });
                                                }
                                            } else {
                                                ModalController.create("info",{
                                                    icon: 'error-mark.svg',
                                                    title: "Error checking paths",
                                                    text: err.message
                                                });
                                            }
                                        })
                                    })
                                }
                            } else {
                                ModalController.create("info",{
                                    icon: 'error-mark.svg',
                                    title: "Error checking paths",
                                    text: err.message
                                });
                            }
                        })
                    }else{

                    }
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

            cfg.createModData(data['path'],data['name'],data['codename'], (modData) => {

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

module.exports = new MCCreate();
//----------------------------------------------------------------------------------------------------------------------