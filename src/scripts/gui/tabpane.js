class TabPane{
    /**
     * @type HTMLElement
     */
    holder;

    /**
     * @type HTMLElement
     */
    parent;

    /**
     * @type HTMLDivElement
     */
    border;

    /**
     * @type Tab[]
     */
    tabs = [];

    /**
     * @type Tab
     */
    selected;

    /**
     * @type {"UP", "DOWN", "LEFT", "RIGHT"}
     */
    type = "DOWN";

    /**
     * @type {function(Tab)[]}
     */
    selectEvents = [];

    /**
     * @type {function(Tab, boolean)[]}
     */
    changeEvents = [];

    duration = 250;

    loop = null;

    constructor() {
    }

    /**
     * @param holder {HTMLElement}
     * @param parent {HTMLElement}
     * @param classes {string}
     */
    push(holder, parent, ...classes){
        this.holder = holder;
        if(this.type === "LEFT" || this.type === "RIGHT"){
            this.holder.classList.add("tab-holder", 'tab-vertical', ...classes);
        }else{
            this.holder.classList.add("tab-holder", 'tab-horizontal', ...classes);
        }

        this.parent = parent;

        this.border = document.createElement('div');
        this.border.classList.add("tab-border", 'tab-' + this.type.toLowerCase());
        utils.addChild(this.holder,this.border);
    }

    /**
     * @param tab {Tab}
     */
    addTab(tab){
        if(this.isEmpty){
            utils.clear(this.parent);
        }
        tab.tabPane = this;
        this.tabs.push(tab);

        tab.construct();
        utils.addChild(this.holder, tab.tab);
        tab.onOpen();
        this.fireChangeEvents(tab,true);
    }

    /**
     * @type tab {Tab}
     */
    removeTab(tab){
        if(this.selected === tab){
            this.selected = null;
        }
        tab.onClose();
        tab.tab.remove();
        utils.removeFromArray(this.tabs, tab);
        this.fireChangeEvents(tab,false);
        if(this.isEmpty){
            utils.clear(this.parent);
            this.whenEmpty(this.parent);
        }else{
            //magic fix
            for (let tab1 of this.tabs) {
                this.select(tab1);
                break
            }
            tab.onBlur();
        }
    }

    pop(){
        if(this.isEmpty){
            utils.clear(this.parent);
            this.whenEmpty(this.parent);
        }else {
            this.select(this.tabs[0], false);
        }
        this.loop = setInterval(() => {
            this.update();
        }, 10);
    }

    /**
     * @param tab {Tab}
     * @param animate
     */
    select(tab, animate = true){
        if(tab == null){
            if(this.isEmpty){
                this.whenEmpty(this.parent);
            }else{

            }
            return
        }
        if(!this.tabs.includes(tab)){
            return
        }
        if(this.selected === tab){
            return;
        }
        let oldTab = this.selected;
        if(this.selected != null){
            this.selected.tab.classList.remove('tab-selected');
        }
        this.selected = tab;
        this.selected.tab.classList.add('tab-selected');

        this.update()

        let dur = animate ? this.duration / 2 : 1;

        utils.fadeOut(this.parent, dur, () => {
            this.parent.innerHTML = "";
            utils.addChild(this.parent, this.selected.element);
            if(oldTab != null){
                oldTab.onBlur();
            }
            tab.onFocus();
            utils.fadeIn(this.parent, dur);
        });

        this.fireSelectEvents(tab);
    }

    update(){
        if(this.selected != null){
            let left = this.selected.tab.offsetLeft;
            let top = this.selected.tab.offsetTop;

            if(this.type === "DOWN" || this.type === "UP") {
                this.border.style.left = left + "px";
                this.border.style.width = this.selected.tab.offsetWidth + "px";
            }else if(this.type === "RIGHT" || this.type === "LEFT") {
                this.border.style.top = top + "px";
                this.border.style.height = this.selected.tab.offsetHeight + "px";
            }
        }else{
            this.border.style.left = '0';
            this.border.style.width = '0';
        }
    }

    /**
     * @param e {function(Tab)}
     */
    addSelectEvent(e){
        this.selectEvents.push(e);
    }

    fireSelectEvents(tab){
        this.selectEvents.forEach((e) => {
            e(tab);
        })
    }
    /**
     * @param e {function(Tab, boolean)}
     */
    addChangeEvent(e){
        this.changeEvents.push(e);
    }

    fireChangeEvents(tab, add){
        this.changeEvents.forEach((e) => {
            e(tab, add);
        })
    }

    get isEmpty(){
        return this.tabs.length <= 0;
    }

    /**
     * @param element {HTMLElement}
     */
    whenEmpty(element){
        this.setEmptyHTML(element)
    }

    /**
     * @param element {HTMLElement}
     */
    setEmptyHTML(element){

    }
}

module.exports.TabPane = TabPane;

class LimitedTabPane extends TabPane{

    addTab(tab) {
        super.addTab(tab);
        this.removeOldTabs();
    }

    update() {
        super.update();
        this.removeOldTabs();
    }

    /**
     * @return boolean
     */
    removeOldTabs(){
        let max = 0;
        for (let tab of this.tabs) {
            let maxLeft = tab.tab.offsetLeft + tab.tab.offsetWidth;
            if(max < maxLeft){
                max = maxLeft;
            }
        }

        if(max > this.holder.offsetWidth){
            //remove only one, the oldest
            /**
             * @type {?ElementTab}
             */
            let oldest = null;
            for (let tab of this.tabs) {
                if(tab instanceof ElementTab){
                    if(oldest == null || oldest.date > tab.date){
                        oldest = tab;
                    }
                }
            }

            if(oldest != null){
                this.removeTab(oldest);
                if(this.tabs.length > 1){
                    this.removeOldTabs();
                }
            }
        }
    }
}

module.exports.LimitedTabPane = LimitedTabPane;

class PanelTabPane extends TabPane{
    headerCount = 0;

    constructor() {
        super();
        this.type = "RIGHT";
        this.save = true;
    }

    /**
     * @param text {string}
     */
    addHeader(text){
        if(this.headerCount > 0){
            let divider = document.createElement('div');
            divider.classList.add("divider");
            utils.addChild(this.holder, divider);
        }
        let header = document.createElement('h3');
        header.innerHTML = text;
        utils.addChild(this.holder, header);
        this.headerCount++;
    }
}

module.exports.PanelTabPane = PanelTabPane;

class ExtendableTabPane extends TabPane{
    /**
     * @type Tab
     */
    newTab;

    /**
     * Tab that will appear after clicking button
     * It will be a copy of newTab
     * @type Tab | null
     */
    addedTab;

    /**
     * @type HTMLImageElement
     */
    addButton;

    canExtend = true;

    /**
     * @param newTab {Tab} tab that will show when creating new
     */
    constructor(newTab) {
        super();
        this.newTab = newTab;
    }

    createButton(){
        if(this.canExtend) {
            this.addButton = document.createElement('img');
            this.addButton.classList.add("tab-add-button");
            this.addButton.src = utils.getIcon('add.svg');
            this.addButton.addEventListener('click', () => {
                this.createNewTab()
            });
            utils.addChild(this.holder, this.addButton);
        }
    }

    pop() {
        super.pop();
        this.createButton();
    }

    createNewTab(){
        if(this.addedTab == null && this.canExtend){
            this.addedTab = this.newTab.clone();
            this.addButton.remove();
            this.addTab(this.addedTab);
            this.addedTab.clicked()
        }
    }

    closeNewTab(){
        if(this.addedTab != null && this.canExtend){
            this.removeTab(this.addedTab);
            this.createButton();
            this.addedTab = null;
        }
    }

}

module.exports.ExtendableTabPane = ExtendableTabPane;

class Tab{
    /**
     * @type TabPane
     */
    tabPane;

    /**
     * @type HTMLElement
     */
    element;

    /**
     * @type string
     */
    name;

    /**
     * @type HTMLElement
     */
    tab;

    /**
     * @type {string[]}
     */
    classes = [];

    /**
     * @param name {string}
     * @param classes
     */
    constructor(name, ...classes) {
        this.classes = Array.from(classes);
        this.element = document.createElement('div');
        if(classes.length > 0 && classes[0] !== ""){
            this.element.classList.add("tab-element", ...classes);
        }

        this.name = name;
    }

    construct(){
        this.tab = document.createElement('div');
        this.tab.classList.add("tab");
        this.tab.innerText = this.name;

        this.tab.addEventListener('click', () => {
            this.clicked();
        })
    }

    clicked(){
        this.tabPane.select(this);
    }

    /**
     * @return Tab
     */
    clone(){
        let tab = new Tab(this.name,...this.classes);
        tab.construct()
        tab.element = this.element.cloneNode(true);
        tab.tabPane = this.tabPane;

        return tab;
    }

    onOpen(){

    }

    onClose(){

    }

    onFocus(){

    }

    onBlur(){

    }
}

module.exports.Tab = Tab;

class ColoredTab extends Tab{
    /**
     * @type string
     */
    color;

    /**
     * @param name {string}
     * @param classes
     * @param color {string}
     */
    constructor(name, color, ...classes) {
        super(name, ...classes);
        this.color = color;
    }

    clicked() {
        super.clicked();
        this.tabPane.border.style.backgroundColor = "#" + this.color;
    }

    clone() {
        let tab = new ColoredTab(this.name, this.color, ...this.classes);
        tab.construct();
        tab.element = this.element.cloneNode(true);
        tab.tabPane = this.tabPane;

        return tab;
    }
}

module.exports.ColoredTab = ColoredTab;

class CloseableTab extends Tab{
    /**
     * @type HTMLElement
     */
    button;

    construct() {
        super.construct();
        this.button = document.createElement('img');
        this.button.classList.add("tab-close-button");
        this.button.src = utils.getIcon('clear.svg');
        this.button.addEventListener('click', () => {
            if(this.tabPane instanceof ExtendableTabPane){
                this.tabPane.closeNewTab();
            }else{
                this.tabPane.removeTab(this);
            }
        });
        utils.addChild(this.tab, this.button);
    }

    /**
     * makes normal, non-closeable tab
     */
    transfer(){
        this.tabPane.addTab(this.toNormal());

        if(this.tabPane instanceof ExtendableTabPane){
            this.tabPane.closeNewTab();
        }else{
            this.tabPane.removeTab(this);
        }
    }

    /**
     * @return Tab normal tab
     */
    toNormal(){
        let tab = new Tab(this.name);
        tab.construct();
        tab.tabPane = this.tabPane;
        return tab;
    }

    clone() {
        let tab = new CloseableTab(this.name, ...this.classes);
        tab.construct();
        tab.element = this.element.cloneNode(true);
        tab.tabPane = this.tabPane;

        return tab;
    }
}

module.exports.CloseableTab = CloseableTab;

class CloseableColoredTab extends CloseableTab{
    /**
     * @type string
     */
    color;

    /**
     * @param name {string}
     * @param classes
     * @param color {string}
     */
    constructor(name, color, ...classes) {
        super(name, ...classes);
        this.color = color;
    }

    clicked() {
        super.clicked();
        this.tabPane.border.style.backgroundColor = "#" + this.color;
    }

    toNormal() {
        let tab = new ColoredTab(this.name, this.color);
        tab.construct();
        tab.tabPane = this.tabPane;
        return tab;
    }

    clone() {
        let tab = new CloseableTab(this.name, this.color, ...this.classes);
        tab.construct();
        tab.element = this.element.cloneNode(true);
        tab.tabPane = this.tabPane;

        return tab;
    }
}

module.exports.CloseableColoredTab = CloseableColoredTab;

class ImageTab extends Tab{
    icon;

    /**
     * @param name {string}
     * @param icon {string}
     * @param classes
     */
    constructor(name, icon, ...classes) {
        super(name, ...classes);
        this.icon = utils.getIcon(icon);
    }


    construct(){
        this.tab = document.createElement('div');
        this.tab.classList.add("tab", "image-tab");

        let image = document.createElement('img');
        image.src = this.icon;

        let text = document.createElement('span');
        text.innerHTML = this.name;

        utils.addChild(this.tab, image, text)

        this.tab.addEventListener('click', () => {
            this.clicked();
        })
    }
}

module.exports.ImageTab = ImageTab;

class ElementTab extends CloseableColoredTab{
    /**
     * Creation date of this tab
     * @type Date
     */
    date;

    /**
     * @type string
     */
    icon;

    /**
     * @type HTMLElement
     */
    iconElement;

    /**
     * @param name {string}
     * @param icon {string}
     * @param color {string}
     * @param classes {...string}
     */
    constructor(name, icon, color, ...classes) {
        super(name, icon, color, ...classes);
        this.icon = icon;
        this.date = new Date(Date.now());
    }

    construct() {
        super.construct();
        this.iconElement = document.createElement('img');
        this.iconElement.src = this.icon;
        this.iconElement.classList.add("tab-small-icon");

        this.tab.insertAdjacentElement('afterbegin',this.iconElement);
    }

    onOpen() {
        this.make(this.element);
    }

    /**
     * Create content here
     * @param content {HTMLElement}
     */
    make(content){

    }
}

module.exports.ElementTab = ElementTab;
