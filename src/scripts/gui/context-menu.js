class ContextMenu{
    /**
     * @type HTMLElement
     */
    parent;
    /**
     * @type HTMLElement
     */
    element;

    /**
     * @param parent {HTMLElement}
     */
    constructor(parent) {
        this.parent = parent;
    }

    /**
     * @param items {function(ContextItem[])}
     * @param e {Event}
     */
    open(items, e){
        if(items === null){
            throw new Error("Context menu not initialized - no items defined.");
        }

        e.preventDefault();
        if(e.target instanceof HTMLElement){
            e.target.focus();
        }

        let constructItems = [];
        items(constructItems);

        this.element = document.createElement('div');
        this.element.classList.add('context-menu');

        for (let item of constructItems) {
            item.construct();
            item.ready();
            utils.addChild(this.element, item.element);
        }

        this.element.classList.add('open');

        utils.addChild(document.body, this.element);

        //pos
        let left = e.clientX;
        let height = this.element.offsetHeight;
        let top = e.clientY;
        top = top + height >= window.screen.width ? (window.screen.height - 10 - height) : top;

        this.element.style.left = left + "px";
        this.element.style.top = top + "px";

        setTimeout(() => {
            this.element.classList.remove('open');
        }, 150);

        this.element.setAttribute('tabindex','1');
        this.element.focus();
        this.element.addEventListener('blur', () => {
            this.close();
        })
    }

    close(){
        utils.fadeOut(this.element, 150, () => {
            this.element.remove();
        })
    }
}

module.exports.ContextMenu = ContextMenu;

/**
 * @interface
 */
class ContextItem{
    /**
     * @type HTMLElement
     */
    element;

    /**
     * @private
     * @type {function[]}
     */
    constructEvents = [];

    constructor() {
    }

    /**
     * @abstract
     */
    construct(){

    }

    ready(){
        for (let constructEvent of this.constructEvents) {
            constructEvent();
        }
    }

    /**
     * @param event {function}
     */
    onConstruct(event){
        this.constructEvents.push(event);
    }
}

//!---------------------------------------------------------------------------------------------------------------------
class DividerContextItem extends ContextItem{
    /**
     * @type {string[]}
     */
    classes = [];

    /**
     * @param classes {string}
     */
    constructor(...classes) {
        super();
        this.classes = classes;
    }

    construct() {
        this.element = document.createElement('div');
        this.element.classList.add("context-divider",...this.classes);
    }
}

module.exports.DividerContextItem = DividerContextItem;

class ButtonContextItem extends ContextItem{
    /**
     * @type string
     */
    text;
    /**
     * @type ?string
     */
    style;
    /**
     * @type function
     */
    action;

    /**
     * @param text {string}
     * @param action {function}
     * @param style {?string}
     */
    constructor(text, action, style = null) {
        super();
        this.text = text;
        this.action = action;
        this.style = style;
    }

    construct() {
        this.element = document.createElement('div');
        this.element.classList.add('context-item');

        if(this.style != null){
            this.element.setAttribute('style', this.style);
        }

        let text = document.createElement('span');
        text.innerText = this.text;
        utils.addChild(this.element, text);
        this.element.addEventListener('click', this.action)
    }
}

module.exports.ButtonContextItem = ButtonContextItem;

class ImageButtonContextItem extends ButtonContextItem{
    /**
     * @type {string} real path
     */
    icon;

    /**
     * @type boolean
     */
    invert;

    /**
     * @param text {string}
     * @param icon {string} real path
     * @param action {function}
     * @param invert {boolean}
     * @param style {?string}
     */
    constructor(text, icon, action, invert = false, style= null) {
        super(text, action, style);
        this.icon = icon;
        this.invert = invert;
    }

    construct() {
        super.construct();
        let image = document.createElement('img');
        image.classList.add("context-icon");
        if(this.invert){
            image.classList.add("context-icon-invert");
        }
        image.src = this.icon;
        this.element.insertAdjacentElement('afterbegin', image);
    }
}

module.exports.ImageButtonContextItem = ImageButtonContextItem;

class MenuButtonContextItem extends ButtonContextItem{
    /**
     * @type {function(ContextItem[])}
     */
    items = null;

    /**
     * @param text {string}
     * @param action {function}
     * @param items {function(ContextItem[])}
     * @param style {?string}
     */
    constructor(text, action, items, style = null) {
        super(text, action, style);
        this.items = items;
    }

    construct() {
        super.construct();
        let image = document.createElement('img');
        image.classList.add('context-arrow')
        image.src = utils.getIcon('arrow_collapse.svg');
        utils.addChild(this.element, image);

        let holder = document.createElement('div');
        holder.classList.add("context-dropdown-menu-holder");

        let menu = document.createElement('div');
        menu.classList.add("context-menu","context-dropdown-menu");

        let items = [];
        this.items(items);
        for (let item of items) {
            item.construct();
            item.ready();
            utils.addChild(menu, item.element);
        }

        utils.addChild(holder, menu);
        utils.addChild(this.element, holder);
    }
}

module.exports.MenuButtonContextItem = MenuButtonContextItem;
