const ITab = require('./itab.js');
const tabpane = require('../../../../gui/tabpane');

class TabAbout extends ITab{

    createTab() {
        this.tab = new tabpane.ImageTab('About','settings.svg','tab-about');
        this.tab.element.classList.add("center-flex");
        this.tab.element.innerHTML = utils.getLoader(60);
        this.element = this.tab.element;
    }

    construct() {
        this.element.classList.remove('center-flex');
        utils.clear(this.element);

        let info = document.createElement('div');
        info.classList.add("info");

        let logo = document.createElement('img');
        logo.classList.add("logo");
        logo.src = this.data.path + "/" + this.data.toml.logoFile;

        let name = document.createElement('div');
        name.classList.add("name");
        name.innerHTML = this.data.name;

        let unsaved = document.createElement('div');
        unsaved.classList.add("titlebox", "unsaved");
        unsaved.innerHTML = "Unsaved changes";
        unsaved.style.display = "none";

        utils.addChild(info,logo,name, unsaved);
        utils.addChild(this.element, info);

        let form = new Form(this.element);
        form.push();

        let fDisplayName = new forms.FormField('displayName',"display name");
        fDisplayName.bottomHTML = "A display name for the mod";
        fDisplayName.setValue(this.data.toml.displayName);

        let fVersion = new forms.FormField('displayName',"version");
        fVersion.bottomHTML = "The version number of the mod - there's a few well known ${} variables useable here or just hardcode it";
        fVersion.setValue(this.data.toml.version);

        let fCodename = new forms.FormField('codename',"codename");
        fCodename.bottomHTML = "Codename for all IDs. <span style='color: red'>Changing this is really unsafe and may cause a lot of problems</span>";
        fCodename.setValue(this.data.codename);

        let fDescription = new forms.FormField('description',"description");
        fDescription.bottomHTML = "The description text for the mod (multi line!)";
        fDescription.setValue(this.data.toml.description);

        let fAuthors = new forms.FormField('authors',"authors");
        fAuthors.bottomHTML = "A text field displayed in the mod UI";
        fAuthors.setValue(this.data.toml.authors);

        let fCredits = new forms.FormField('credits',"credits");
        fCredits.bottomHTML = "A text field displayed in the mod UI";
        fCredits.setValue(this.data.toml.credits);

        let fModLoader = new forms.FormField('modLoader',"mod loader");
        fModLoader.bottomHTML = "The name of the mod loader type to load - for regular FML @Mod mods it should be javafml";
        fModLoader.setValue(this.data.toml.modLoader);

        let fLoaderVersion = new forms.FormField('loaderVersion',"loader version");
        fLoaderVersion.bottomHTML = "A version range to match for said mod loader - for regular FML @Mod it will be the forge version";
        fLoaderVersion.setValue(this.data.toml.loaderVersion);

        let fIssueTrackerURL = new forms.FormField('issueTrackerURL',"issue tracker url");
        fIssueTrackerURL.bottomHTML = "A URL to refer people to when problems occur with this mod";
        fIssueTrackerURL.setValue(this.data.toml.issueTrackerURL);

        let fUpdateJSONURL = new forms.FormField('updateJSONURL',"update json url");
        fUpdateJSONURL.bottomHTML = "A URL to query for updates for this mod";
        fUpdateJSONURL.setValue(this.data.toml.updateJSONURL);

        let fDisplayURL = new forms.FormField('displayURL',"display url");
        fDisplayURL.bottomHTML = "A URL for the \"homepage\" for this mod, displayed in the mod UI";
        fDisplayURL.setValue(this.data.toml.displayURL);

        let fLogoFile = new forms.FormField('logoFile',"logo file name");
        fLogoFile.bottomHTML = "A file name (in the root of the mod JAR) containing a logo for display";
        fLogoFile.setValue(this.data.toml.logoFile);

        form.addEntries(fDisplayName, fVersion, fCodename, fDescription, fAuthors, fCredits, fModLoader, fLoaderVersion, fIssueTrackerURL, fUpdateJSONURL, fDisplayURL, fLogoFile);

        form.addChangeListener((entry) => {
            unsaved.style.display = "block";
        })

        form.pop();

        let formButtons = document.createElement('div');
        formButtons.classList.add("form-buttons");

        let saveButton = new forms.Button('Save',() => {
            form.serializeAndSend("about:forms:result");
            unsaved.style.display = "none";
        });
        saveButton.addTo(formButtons);
        let cancelButton = new forms.Button('Reset',() => {
            LOG.log("Reset");
            form.reset();
            unsaved.style.display = "none";
        },null,true);
        cancelButton.addTo(formButtons);

        utils.addChild(this.element, formButtons);
    }
}

module.exports.TabAbout = TabAbout;