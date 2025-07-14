# DJUI Javascript
A port of DJUI, seen in SM64CoopDX's sm-lua, to Javascript, for use in fully custom website rendering

## How to use:

1. Open up Command Line, and Set your Current Working Directory to your Repository/Local Site Clone
```cmd
cd /home/squishy6094/Documents/Websites/squishy6094.github.io
```
2. Add DJUI Javascript as a submodule
```cmd
git submodule add https://github.com/Squishy6094/djui-javascript djui-js
```
3. Load the djui-js script in your HTML file of choice
```html
<script type="text/javascript" src="/djui-js/djui.js"></script>
```
4. (Optional) To update DJUI Javascript, you can use the following command to update to the latest commit
```cmd
git submodule foreach git pull origin main
```

And you're done! You should now be able to access the DJUI Functions avalible in SM64CoopDX directly in Javascript

Note that this is not yet feature complete, futher functions and thier ulitilies will be added down the line. but as it is right now, most basic rendering functionalities are available!

You can look at the [Pages Branch](https://github.com/Squishy6094/djui-javascript/tree/pages) or the [Squishy Site](https://github.com/Squishy6094/squishy6094.github.io) for examples on how to directly use DJUI Javascript
