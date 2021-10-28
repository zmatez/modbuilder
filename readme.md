<div style="display: flex; flex-flow: column; justify-content: center; align-items: center">
    <img src="src/assets/icons/logo.png" alt="logo">
    <h1>ModBuilder</h1>
    <hr>
    <p>Make Minecraft mods easily</p>
    <div style="display: flex; flex-flow: row; gap: 5px">
        <img alt="GitHub language count" src="https://img.shields.io/github/languages/count/zmatez/modbuilder?color=%23FF8967">
        <img alt="Lines of code" src="https://img.shields.io/tokei/lines/github/zmatez/modbuilder?color=%23512446">
        <img alt="GitHub issues" src="https://img.shields.io/github/issues/zmatez/modbuilder?color=%23FF8967">
        <img alt="GitHub pull requests" src="https://img.shields.io/github/issues-pr/zmatez/modbuilder?color=512446">
        <img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/zmatez/modbuilder?color=FF8967">
        <img alt="GitHub package.json version" src="https://img.shields.io/github/package-json/v/zmatez/modbuilder?color=512446">
        <img alt="GitHub package.json dependency version (dev dep on branch)" src="https://img.shields.io/github/package-json/dependency-version/zmatez/modbuilder/dev/electron?color=FF8967">
    </div>
</div>

---
## What is this for?
This app is for all modders that are making huge (or not) Minecraft mods and are **tired of managing and filling out all the JSON files** you need to create blocks, items or recipes.
Now everything is stored in one place, neatly combined and connected. You can **see texture of your block, check errors** or delete block with all connected files with one click.  
Have thousands of files unsorted in blockstates folder? No more! ModBuilder supports abstract file structure - you can create folders that aren't real, visible only in the app.  
Create multiple mods, bulk copy and replace blocks and items, edit textures, **generate registry and language files**. Everything's here. Easily.
  
App uses material-like design to not make any eyes bleeding.

---
## Features
- creating or importing mod's resources
- creating and managing blocks, items and textures
- connecting all files that use themselves - see texture in the blockstate
- advanced copy system (todo) - copy chair for all planks you have - blockstates, models and items
- editing TOML file
- auto-generating registry files (todo) - specify a constructor for your blocks and copy all the code to properly register all of them
- language support (todo) - generate JSON with filled block and item names
- error checking - find missing textures or models
- json editing and spell-checking (uses JsonEditor/Ace)
- import Minecraft resources and index them as yours
- material design

![app's sample image](https://i.imgur.com/rRBraJr.png)

---
## Setup
Clone this repo to your desktop and run `npm install` to install all the dependencies.

---
## Usage
Open the app with `npm start`, it will trigger `electron .` command. You see few options there. Click Create for creating new ModBuilder project or Import for importing an existing one.
Delete button does not work yet. After clicking Create, specify a folder with your mod's resources - it has to contain `assets/<modname>/` and `data/<modname>` folders.
Specify mod's name and mod's codename (registry name).  
When you open the mod and it will index all the files, you see few tabs. First one - About - is for TOML. Save button also does not work ;)
Next tabs are Blocks (Blockstates), Models (Block Models), Items (Item Models) and Textures. They're pretty similar. You see there a panel with
files. You can double click to open a file or right click to see context menu. Also you can select one or more, for example to drag and move to the folder.  
After opening the file you see some panels on the right, and a preview. Explore them - it's actually pretty easy to understand.

---
## To Do & Contribution
This app isn't finished yet, **feel free or even feel obligated to contribute** to make it usable, for me, for you and for all modders.  
I've listed few uncompleted things that need to be done before full usability of this app:
- Registry:
    - Add a constructor text field to all blocks and items to input e.g `SuperBlock($regname, $properties)`
    - Add a properties chooser to easily add properties to the block ($properties argument)
    - Add a global thing to manage properties that can be used
    - Add to the Registry tab two sections - Blocks and Items (as another tab probably)
    - Choose between 1-line (static constructor, without double-call (DeferredRegister)) and 2-line (list and constructor later)
    - Textfield with regex to edit final constructors, e.g `$realname = new $constructor.setRegistryName($regname);`
    - Textfield with regex to edit list e.g `public static $realname;`
    - Output generation (textfields - one or two textfields - first one for the list and second one for the constructors)
- Files:
    - Creating files in real (now they just stay in the ModBuilder's session, aren't saved to the filesystem or even to config file)
    - Creating new files
    - Connect blockstates <-> block models <-> textures
    - Deleting, delete popup ("Do you want to delete also connected files? Those files will be deleted too: <fancy list with all dependencies>")
    - Renaming files, also renaming usages in other JSON files if the file name changes, reloading tabs that uses old name
- Language:
    - Language tab add
    - Add new languages
    - After adding language all blocks and items will get new textfield with the name to input in specified language
    - Generating JSONs with all translations for certain language
    - English language is default and unremovable.
- Recipes (by the way...)
- Tags (by the way...)
- By the way stuff:
    - Changing blocks and item view in tabs from just images to a fancy 3D model generated from JSON (like MC does)
    - Forge/Fabric choosing
    
###Contribution tips
- Find cool icons on [FlatIcon](https://flaticon.com)
- mc_* files are for client, while rc_* files are for renderer processes (Electron shit...)

---
## License
Project uses **MIT license**.

---
## Donate
Buy me a coffee! I'm not even adult so any money sent makes me smile :)
<form action="https://www.paypal.com/donate" method="post" target="_top" style="cursor: pointer">
<input type="hidden" name="hosted_button_id" value="XX8SZ8BY9B4J6" />
<input type="image" src="https://www.paypalobjects.com/en_US/i/btn/btn_donate_LG.gif" border="0" name="submit" title="PayPal - The safer, easier way to pay online!" alt="Donate with PayPal button" />
<img alt="" border="0" src="https://www.paypal.com/en_PL/i/scr/pixel.gif" width="1" height="1" />
</form>
