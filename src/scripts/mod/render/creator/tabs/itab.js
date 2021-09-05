/**
 * @interface
 */
class ITab {
    /**
     * @type CreatorController
     */
    controller;

    /**
     * @type HTMLElement parent element
     */
    element;

    /**
     * @type ?*
     */
    data;

    /**
     * @type IMod
     */
    mod;

    /**
     * @type Tab
     */
    tab;

    /**
     * @param controller {CreatorController}
     * @param data {?*}
     */
    constructor(controller, data = null) {
        this.controller = controller;
        this.mod = controller.mod;
        this.data = data;
    }

    /**
     * @abstract
     */
    createTab(){

    }

    /**
     * @abstract
     */
    construct(){

    }

    /**
     * @param parent {?ExplorerParent}
     * @param event {Event}
     */
    createContextMenu(parent, event){

    }

    /**
     * @param element {HTMLElement}
     */
    emptyHTML(element){
        let emptyHolder = document.createElement('div');
        emptyHolder.classList.add('empty-holder','center-flex');
        let empty = document.createElement('div');
        empty.classList.add("empty");

        let title = document.createElement('h1');
        title.innerHTML = "Nothing's here";
        let text1 = document.createElement('div');
        text1.innerHTML = "<span>Click</span> on any file to select";
        let text2 = document.createElement('div');
        text2.innerHTML = "<span>Double Click</span> on any file to edit";
        let text3 = document.createElement('div');
        text3.innerHTML = "<span>CTRL + Click</span> on files to select multiple";
        let text4 = document.createElement('div');
        text4.innerHTML = "<span>SHIFT + Click</span> on two files to select all between them";
        let text5 = document.createElement('div');
        text5.innerHTML = "<span>RClick</span> on any file(s) shows options";
        utils.addChild(empty, title, text1,text2,text3,text4,text5);
        utils.addChild(emptyHolder, empty);
        utils.addChild(element, emptyHolder);
    }
}

module.exports = ITab;