//---- MAIN ------------------------------------------------------------------------------------------------------------
const MainController = require('../../../init/controller_main.js');
class MCLoader extends MainController{
    getName() {
        return "loader";
    }

    onOpen(data) {
        setTimeout(() => {
            cfg.load();
            this.close();
            manager.start();
            loaderWindow.close()
            manager.create(new AppWindow("Start","index.html"))
                .withProp('resizable',false)
                .withProp('width',750)
                .withProp('height',500)
                .open('index');
        }, startTimeout)
    }

    onClose() {

    }
}

module.exports = new MCLoader();
//----------------------------------------------------------------------------------------------------------------------