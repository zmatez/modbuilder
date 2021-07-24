const ITab = require('./itab.js');
const tabpane = require('../../../../gui/tabpane');
const explorer = require('../../../../gui/fileexplorer');
const modelmenu = require('../modelmenu');

class TabItems extends ITab{
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
        this.tab = new tabpane.AnimatedImageTab('Items','items_gray.svg','item.svg','tab-editor','tab-items');
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
            if(file instanceof explorer.ItemFile){
                /**
                 * @type {?ElementTab}
                 */
                let existingTab = null;
                for (let tab of this.contentPane.tabs) {
                    if(tab instanceof ItemTab && tab.itemFile === file){
                        existingTab = tab;
                        break
                    }
                }

                if(existingTab == null){
                    let tab = new ItemTab(file);
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
        this.controller.contentPanes.item = this.contentPane;
        this.controller.tabExplorers.item = this.tabExplorer;
        this.controller.explorers.item = this.explorer;
        this.controller.callbacks.item = {
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

module.exports.TabItems = TabItems;

class ItemTab extends tabpane.ElementTab{
    /**
     * @type ItemFile
     */
    itemFile;

    /**
     * @type Item
     */
    item;

    /**
     * @param itemFile {ItemFile}
     */
    constructor(itemFile) {
        super(itemFile.getName(), itemFile.getIcon(), '45D32C');
        this.itemFile = itemFile;
        this.item = itemFile.getItem();
    }

    make(content) {
        content.classList.add('element-tab-content');
        // ? LEFT
        let contentLeft = document.createElement('div');
        contentLeft.classList.add("element-content-left");

        {
            let section = document.createElement('div');
            section.classList.add("content-section");
            // * HEADER
            let header = document.createElement('h2');
            header.innerHTML = "Properties";
            utils.addChild(section, header);

            let form = new Form(section);
            form.push();
            let name = new forms.FormField('name', "Codename");
            name.setValue(this.itemFile.getName());
            let displayName = new forms.FormField('display_name','Display Name');//todo display name
            displayName.bottomHTML = "More languages are available in Languages tab.";
            form.addEntries(name, displayName);
            form.pop()

            utils.addChild(contentLeft, section);
        }
        {
            let section = document.createElement('div');
            section.classList.add("content-section");
            // * HEADER
            let header = document.createElement('h2');
            header.innerHTML = "Parent";
            utils.addChild(section, header);

            let parent = this.item.findParent();
            let itemParent = document.createElement('div');
            itemParent.classList.add("item-parent-section");
            if(this.item.parent == null || parent == null){
                itemParent.classList.add("item-parent-empty");
                if(this.item.parent == null){
                    itemParent.innerHTML = "This item has no parent specified."
                }else{
                    itemParent.innerHTML = "Unable to find parent in the Registry: " + this.item.parent;
                }
            }else{
                const {BlockModel, Item} = require('../../../resource/assets');
                if(parent instanceof Item){
                    let item = new modelmenu.ItemVisual(parent,1);
                    item.showTextures = false;
                    utils.addChild(itemParent, item.construct());
                }else if(parent instanceof BlockModel){
                    let model = new modelmenu.ModelVisual(parent, 1);
                    model.showTextures = false;
                    utils.addChild(itemParent, model.construct());
                }else{
                    //rip
                }
            }
            utils.addChild(section, itemParent);

            utils.addChild(contentLeft, section);
        }
        {
            let section = document.createElement('div');
            section.classList.add("content-section");
            // * HEADER
            let header = document.createElement('h2');
            header.innerHTML = "Parent Texture Diagram";
            utils.addChild(section, header);

            let diagram = new modelmenu.ParentTextureDiagram(section, this.item);
            diagram.construct();

            utils.addChild(contentLeft, section);
        }

        // ? RIGHT
        let contentRight = document.createElement('div');
        contentRight.classList.add("element-content-right");
        let header = document.createElement('div');
        header.classList.add("right-header");
        let headerText = document.createElement('h2');
        headerText.innerHTML = "Item View";
        utils.addChild(header, headerText);
        let modelContent = document.createElement('div');
        modelContent.classList.add("model-content");

        //let ModelRender = require('minerender/src/model');
        //let render = new ModelRender({}, modelContent);
        //render.render(['block/stone']);

        utils.addChild(contentRight, header, modelContent);
        //
        utils.addChild(content, contentLeft, contentRight);
    }

    onOpen() {
        super.onOpen();
        this.itemFile.open();
    }

    onClose() {
        super.onClose();
        this.itemFile.close();
    }
}