//---- RENDERER --------------------------------------------------------------------------------------------------------
let {RendererController, RendererAdapter} = require('../../../init/controller_renderer');

let rName = "import";

class Adapter extends RendererAdapter{
    getName() {
        return rName;
    }
}

class Controller extends RendererController{
    listenerChooser;

    getName() {
        return rName;
    }

    onOpen(data) {
        let form = new Form(utils.byClass('form-box'));
        form.push();

        let chooser = new forms.ButtonFormField('path','folder path',"Choose", () => {
            api.send("forms:chooser","");
        });
        chooser.readOnly = true;
        chooser.placeholder = "Choose a folder to import (modbuilder.json)"

        let name = new forms.FormField('name','mod name');
        name.placeholder = "Import file to show name";
        name.readOnly = true;
        let codename = new forms.FormField('codename','mod codename');
        codename.placeholder = "Import file to show codename";
        codename.readOnly = true;

        form.addEntries(chooser,name,codename);

        //-------------------
        let saveButton = new forms.Button('Import',() => {
            form.serializeAndSend("forms:result");
        });
        saveButton.addTo(utils.byClass('form-buttons'));
        let cancelButton = new forms.Button('Cancel',() => {
            api.send("open:main", "");
        },null,true);
        cancelButton.addTo(utils.byClass('form-buttons'));

        form.pop();

        this.listenerChooser = (data) => {
            chooser.setValue(data.path);
            name.setValue(data.name);
            codename.setValue(data.codename);
        }
        api.receive('forms:chooser', this.listenerChooser);
    }

    onClose() {
        api.removeListener('forms:chooser', this.listenerChooser);
    }
}

module.exports.adapter = new Adapter();
module.exports.controller = new Controller();
//----------------------------------------------------------------------------------------------------------------------