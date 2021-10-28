const ITab = require('./itab.js');
const tabpane = require('../../../../gui/tabpane');

class TabRegistry extends ITab{

    createTab() {
        this.tab = new tabpane.AnimatedImageTab('Registry','registry_gray.png','registry.png','tab-registry');
        //this.tab.element.classList.add("center-flex");
        //this.tab.element.innerHTML = utils.getLoader(60);
        this.element = this.tab.element;
    }

    construct() {
        this.element.classList.remove('center-flex');
        utils.clear(this.element);


    }
}

module.exports.TabRegistry = TabRegistry;