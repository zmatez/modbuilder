//---- MAIN ------------------------------------------------------------------------------------------------------------
const MainController = require('../../../init/controller_main.js');
const {AbstractFileExplorer} = require("../../../gui/fileexplorer");
const resources = require('../../../mod/resource/resources');

class MCCreator extends MainController{
    /**
     * @type {Mod}
     */
    mod;

    tomlLoaded = false;
    assetsLoaded = false;

    //listeners

    getName() {
        return "creator";
    }

    onOpen(data) {
        /**
         * @type ModData
         */
        let modData = cfg.modData[data.name];
        if(modData == null){
            return
        }
        this.mod = new Mod(modData, (registry) => {
            this.sendMessage('data:registry', registry);
        });
        this.receive('data:registry', (registry) => {
            this.mod.modRegistry.deserialize(registry);
        })
        // * callback setup
        this.mod.setup((data) => {
            this.sendMessage('data:progress',data);
        },() => {
            this.tomlLoaded = true;
            this.sendMessage('data:about',{
                name: this.mod.name,
                codename: this.mod.codename,
                path: this.mod.path,
                toml: this.mod.tomlConfig
            });
        }, () => {
            this.assetsLoaded = true;
            //this.mod.modRegistry.send();
            this.sendMessage('data:assets',this.mod.serialize());
            this.sendMessage('data:registry', this.mod.modRegistry.serialize())

            this.sendMessage('data:render', {
                blockstates: this.mod.assetLoader.blocks.serialize(),
                items: this.mod.assetLoader.items.serialize(),
                textures: this.mod.assetLoader.textures.serialize()
            })
            LOG.success("Loaded assets.")
        })
        global.mod = this.mod;

        // ? -------------------------------------------------------------------

        setTimeout(() => {
            this.mod.load();
        }, 1000);

        this.receive('open:resources', () => {
            // ? RESOURCES
            let modal = ModalController.create('resources',this.mod.modResources.resources,350,520);
            modal.onAction('import', (data) => {
                dialog.showOpenDialog({ properties: ['openDirectory'] })
                    .then((result) => {
                        if(result == null || result.filePaths == null || result.filePaths[0] == null){
                            return
                        }
                        let fPath = path.normalize(result.filePaths[0]);
                        let resource = new resources.ModResource(null, fPath);
                        if(resource.load()){
                            if(resource.loadCodename()){
                                if(resource.codename === this.mod.codename){
                                    let info = ModalController.create('info', {
                                        icon: 'error-mark.svg',
                                        title: "Codename duplicate",
                                        text: "Detected codename '" + resource.codename + "' is the same as the codename of this project."
                                    })
                                }else {
                                    LOG.success("Imported resource '" + resource.codename + "'")
                                    this.mod.modResources.addResource(resource);
                                    modal.sendAction('update', this.mod.modResources.resources);
                                }
                            }else{
                                let info = ModalController.create('info', {
                                    icon: 'error-mark.svg',
                                    title: "Error reading codename",
                                    text: "Unable to read codename for resource. Make sure that in /assets/ folder there is a folder named with desired codename. <br>Example: /assets/minecraft/"
                                })
                            }
                        }else{
                            let info = ModalController.create('info', {
                                icon: 'error-mark.svg',
                                title: "Error loading resource",
                                text: "Unable to load resource for path: '" + fPath + "'.<br>Make sure it contains folders 'data' and 'assets' with valid folder tree."
                            })
                        }
                    });
            });
            modal.onAction('remove', (data) => {
                let codename = data;
                this.mod.modResources.removeResource(codename);
                modal.sendAction('update', this.mod.modResources.resources);
            });
            modal.onClose(() => {
                if(this.mod.modResources.needsReload){
                    this.sendMessage('data:reload','');
                    this.mod.load();
                }
            })
        })
    }

    onClose() {

    }
}

module.exports = new MCCreator();
//----------------------------------------------------------------------------------------------------------------------