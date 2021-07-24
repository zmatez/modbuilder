const ITab = require('./itab.js');
const tabpane = require('../../../../gui/tabpane');
const explorer = require('../../../../gui/fileexplorer');
const modelmenu = require('../modelmenu');

class TabBlockModels extends ITab{
    /**
     * @type FileExplorer
     */
    explorer;
    /**
     * @type HTMLElement
     */
    tabExplorer;
    /**
     * @type TabPane
     */
    contentPane;
    /**
     * @type function
     */
    openCallback;

    createTab() {
        this.tab = new tabpane.AnimatedImageTab('Models','models_gray.svg','model.svg','tab-editor','tab-block-models');
        this.element = this.tab.element;
    }

    construct() {
        // ? -------------------------- MENU ---------
        let leftBox = document.createElement('div');
        leftBox.classList.add("left-box");

        let expl = document.createElement('div');
        expl.classList.add("file-explorer-holder")
        let toolbar = this.createToolbar((text) => {
            if(this.explorer != null){
                this.explorer.search(text)
            }
        }, (name, callback) => {
            if(this.explorer != null){
                let folder = this.explorer.createFolder(name, this.mod.blockStatePath, null, callback);
            }
        });

        this.tabExplorer = expl;
        utils.addChild(leftBox, expl, toolbar);

        // ? -------------------------- CONTENT ---------
        let rightBox = document.createElement('div');
        rightBox.classList.add("right-box");


        let contentTabHolder = document.createElement('div');
        contentTabHolder.classList.add("editor-content-tab-holder");

        let content = document.createElement('div');
        content.classList.add("editor-content");

        utils.addChild(rightBox, contentTabHolder, content);

        this.contentPane = new tabpane.LimitedTabPane();
        this.contentPane.push(contentTabHolder, content);
        this.contentPane.setEmptyHTML = this.emptyHTML
        this.contentPane.pop();

        this.openCallback = (file) => {
            if(file instanceof explorer.BlockModelFile){
                /**
                 * @type {?ElementTab}
                 */
                let existingTab = null;
                for (let tab of this.contentPane.tabs) {
                    if(tab instanceof BlockModelTab && tab.blockModelFile === file){
                        existingTab = tab;
                        break
                    }
                }

                if(existingTab == null){
                    let tab = new BlockModelTab(file);
                    this.contentPane.addTab(tab);
                    tab.clicked()
                }else{
                    this.contentPane.select(existingTab);
                }
            }else{
                //ignore all others
            }
        }

        utils.addChild(this.element, leftBox, rightBox);

        // ! --------------------------------------------------------------------
        this.controller.contentPanes.blockModel = this.contentPane;
        this.controller.tabExplorers.blockModel = this.tabExplorer;
        this.controller.explorers.blockModel = this.explorer;
        this.controller.callbacks.blockModel = {
            open: this.openCallback
        }
    }

    /**
     * @param searchCallback {function(string)}
     * @param newFolderCallback {function(string, function)}
     * @return {HTMLDivElement}
     */
    createToolbar(searchCallback, newFolderCallback){
        let toolbar = document.createElement('div');
        toolbar.classList.add("explorer-toolbar");

        let search = new forms.FormField('search-bar',"");
        search.placeholder = "Search";
        search.changeListeners.push((entry) => {
            searchCallback(search.getValue());
        })

        utils.addChild(toolbar, search.getElement());

        //buttons
        let buttons = document.createElement('div');
        buttons.classList.add('buttons');

        function createButton(name, icon, action){
            let button = new forms.IconButton(name, icon, action);
            button.addTo(buttons);
            return button;
        }

        createButton("New asset", "new_file.svg", () => {

        })

        /**
         * @type {?FormTooltip}
         */
        let newFolderTooltip = null;
        createButton("New folder", "new_folder.svg", () => {
            if(newFolderTooltip != null){
                newFolderTooltip.hide();
                newFolderTooltip = null;
                return
            }
            newFolderTooltip = new tooltips.FormTooltip(buttons, "Add new folder", 'new_folder.svg', '', 'Create', 'Cancel', (form) => {
                let name = form.serialize()['folder-name'];
                newFolderCallback(name, () => {
                    newFolderTooltip.hide();
                });
            }, 'media-folder-create', (element) => {
                let form = new Form(element);
                form.push();
                let nameField = new forms.FormField('folder-name', "Name");
                form.addEntries(nameField);
                form.pop();
                return form;
            });
            newFolderTooltip.placementY = "above";
            newFolderTooltip.show();
            newFolderTooltip.addHideEvent(() => {
                newFolderTooltip = null;
            })
        })

        createButton("Copy", "copy.svg", () => {

        })

        createButton("Delete", "delete.svg", () => {

        })

        utils.addChild(toolbar, buttons);

        return toolbar;
    }
}

module.exports.TabBlockModels = TabBlockModels;

class BlockModelTab extends tabpane.ElementTab{
    /**
     * @type BlockModelFile
     */
    blockModelFile;

    /**
     * @type BlockModel
     */
    blockModel;

    /**
     * @param blockModelFile {BlockModelFile}
     */
    constructor(blockModelFile) {
        super(blockModelFile.getName(), blockModelFile.getIcon(), '45D32C');
        this.blockModelFile = blockModelFile;
        this.blockModel = blockModelFile.getBlockModel();
    }

    make(content) {
        content.classList.add('element-tab-content');
        // ? LEFT
        let contentLeft = document.createElement('div');
        contentLeft.classList.add("element-content-left");

        {
            modutils.createRegistrySection('Properties', section => {
                let holder = document.createElement('div');
                holder.classList.add('property-section');
                modutils.createPropertySection('ID',(content) => {
                    content.innerText = this.blockModel.location.location;
                    content.style.cursor = 'pointer';
                    utils.onClick(content, () => {
                        utils.copyToClipboard(this.blockModel.location.location, content, 'under');
                    })
                }, holder);
                utils.addChild(section, holder)
            }, contentLeft);
        }
        {
            modutils.createRegistrySection('Modify', section => {
                let form = new Form(section);
                form.push();
                let name = new forms.FormField('name', "Codename");
                name.setValue(this.blockModelFile.getName());
                form.addEntry(name);
                form.pop()
            }, contentLeft);
        }
        {
            modutils.createRegistrySection('Textures', section => {
                let texturesList = document.createElement('div');
                texturesList.classList.add("info-textures", 'texture-list');

                // ? TEXTURES
                /**
                 * @type {{texture: Texture, count: number}[]}
                 */
                let textures = [];
                for (let texture of this.blockModel.textures) {
                    let regTexture = mod.modRegistry.getTexture(texture.location);
                    let contains = false;
                    for (let tex of textures) {
                        if (tex.texture === regTexture) {
                            tex.count++;
                            contains = true;
                            break;
                        }
                    }

                    if (!contains) {
                        textures.push({
                            texture: regTexture,
                            count: 1
                        })
                    }
                }

                for (let texture of textures) {
                    let visual = new modelmenu.TextureVisual(texture.texture, texture.count);
                    let el = visual.construct();
                    utils.addChild(texturesList, el);
                }
                utils.addChild(section, texturesList);
            }, contentLeft);
        }
        {
            modutils.createRegistrySection('Usages', section => {
                let modelUsageList = new modelmenu.ModelUsageList(section, this.blockModel);
                setTimeout(() => {
                    modelUsageList.construct();
                }, 0)
            }, contentLeft);
        }

        // ? RIGHT
        let contentRight = document.createElement('div');
        contentRight.classList.add("element-content-right");
        let header = document.createElement('div');
        header.classList.add("right-header");
        let headerText = document.createElement('h2');
        headerText.innerHTML = "Model View";
        utils.addChild(header, headerText);
        let modelContent = document.createElement('div');
        modelContent.classList.add("model-content");

        utils.addChild(contentRight, header, modelContent);

        //
        utils.addChild(content, contentLeft, contentRight);
    }

    onOpen() {
        super.onOpen();
        this.blockModelFile.open();
        console.log("Open: " + this.blockModel.location.location)
    }

    onClose() {
        super.onClose();
        this.blockModelFile.close();
    }
}
