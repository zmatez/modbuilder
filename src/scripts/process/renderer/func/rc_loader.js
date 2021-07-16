//---- RENDERER --------------------------------------------------------------------------------------------------------
let {RendererController, RendererAdapter} = require('../../../init/controller_renderer');

let rName = "loader";

class Adapter extends RendererAdapter{
    getName() {
        return rName;
    }
}

class Controller extends RendererController{
    getName() {
        return rName;
    }

    onOpen(data) {
        let background = utils.byClass('background');
        let content = utils.byClass('content');
        let loader = utils.byClass('loader-bar');

        let backgrounds = {
            'autumnal_forest.png': 'light',
            'beech_forest.png': 'light',
            'cold_forest.png': 'light',
            'cottage.png': 'light',
            'fields.png': 'light',
            'forest.png': 'light',
            'frozen_river.png': 'light',
            'hills.png': 'light',
            'jungle.png': 'light',
            'meadow.png': 'light',
            'mesa.png': 'light',
            'night_forest.png': 'dark',
            'oasis.png': 'light',
            'outback.png': 'dark',
            'rainforest.png': 'light',
            'safari.png': 'light',
            'sequoia_forest.png': 'light',
            'shrublands.png': 'light',
            'steppe.png': 'light',
            'taiga.png': 'light',
            'tatooine.png': 'light',
            'tatra.png': 'light',
            'tundra.png': 'dark',
            'valley.png': 'light',
            'wooded_meadow.png': 'light',
            'wooded_outback.png': 'light'
        }

        let i = 0;
        for (let key in backgrounds) {
            i++;
        }

        /**
         * @type {"dark", "light"}
         */
        let theme = "light";

        let random = utils.random(0,i-1);
        i = 0;
        for (let key in backgrounds) {
            if(i === random){
                background.style.backgroundImage = `url('../assets/images/themes/${key}')`;
                theme = backgrounds[key];
                break;
            }
            i++;
        }

        let ll;
        if(theme === 'light'){
            ll = utils.getLoader(50, true, true);
        }else{
            ll = utils.getLoader(50, true, false);
        }

        utils.addHTML(loader, ll);

        let statusText = document.createElement('span');
        statusText.innerHTML = "Initializing...";
        utils.addChild(loader, statusText);
    }

    onClose() {

    }
}

module.exports.adapter = new Adapter();
module.exports.controller = new Controller();
//----------------------------------------------------------------------------------------------------------------------