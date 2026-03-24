# Burn the Village Concept Doc

> This file is the original concept/vision document for the project.
> The shipped implementation has evolved since this was written.
> When behavior, UI, or feature scope matters, treat the current codebase and tests as canon, then use this file as product direction and future-context only.

## Overview

* Burn the village is a 2D top down level based web app game to be hosted on GitHub pages (and eventually, if things go well, a mobile iOS app) where the goal of the game is to leverage a fire source and hay to ‘burn’ houses/structures located on a 2d map.  
* The goal of the game is to burn as much of the houses/structures as possible, using finite resources like hay/TNT, scoring is determined by how much of a level’s structure is destroyed, and by how much of the finite resources are used. The higher the destruction %, and the lower the resources usage, the higher the score.  
* There will be many levels, and a WYSIWYG level editor so the user can design and test their own levels.  
* The game is touch native, however, it should be playable on both a touch enabled device as well as a non touch enabled one.

## Main Gameplay Interface

* The game will have a 8bit look to it like Minecraft. The look and feel of the game will be retro.   
* The entire interface is rendered in a panel as opposed to presented via text/DOM elements, this is to maintain the retro/8bit look of the game.  
* The interface is split into 3 basic sections:  
  * A square map, occupying the top left of the panel  
  * A sidebar in the panel on the right where the user can click square buttons to select hay or TNT to place on the map.  
    * The button for hay / TNT will feature 8bit art representing hay/TNT.  
    * There will also be two buttons at the bottom of the side bar for speed, increasing the speed is akin to increasing the clock speed and everything runs faster (ie. burning animation), decreasing the speed will decrease the burning speed. There will be fixed levels for speed: Slowest, Slow, Normal, Fast, Fastest. There will be a label for the current speed of the game. All animations are controlled by this speed.  
    * There will be a reset button, when clicked, will reset the level to the original state so the user can try again, resources like hay/TNT are reset, so are structures.  
  * A bottom progress bar in the panel representing the minimum destruction % needed to progress to the next level, as well as a numerical score, with threshold markings for gold/silver/bronze ratings. As structures are burned in real time, the progress bar is updated in real time.

## Level

* In each level, there will be at least one fire source, at least one structure, and a finite amount of hay/TNT as dictated by the level metadata.  
* Any point on the map can either be occupied or not occupied. The point is occupied if there exists a fire source, hay, TNT, or structure there. It is not occupied otherwise and hay/TNT can be placed there.  
* **Fire Source**  
  * The fire source cannot be overridden by anything in the level, there will always be at least one fire source. The fire source is a small circle that is animated to look like a small fire.  
* **Hay**  
  * Hay is the primary conductor of fire between the fire source and the structures. It is drawn on the map via a brush tool in the sidebar.  
  * The hay is expended as the user draws the hay on the 2d map. The user can specify the size of the brush (S,M,L) used to lay down hay, the larger the brush, the faster the finite hay expends.  
  * The hay should be a dark yellow color, with a texture to make it look like hay.  
* **Houses/Structures**  
  * Houses/Structures represent the thing to be burned down. There will be three types of structures to start. A small round hut, a medium sized square house, and a large rectangle house.  
  * Because the view is top down, the user will see the roofs of these structures only, make it look like a roof that is different shades of brown in color.  
* **TNT**  
  * The user can select the TNT and touch on the map to lay down the TNT in that spot, the TNT occupies a fixed small square spot on the map.  
  * The TNT is black/grey in color, with the letters TNT on it.  
* **Ground/Grass**  
  * Unoccupied space on the map is ground/grass, this is not a conductor of fire and is light green in color.  
* **Completing the Level**  
  * The player moves on to the next level when the minimum destruction % is hit.  
  * The player will see a level completion summary pop up box over the map and their rating, ie. gold/silver/bronze.

## Burning/Expansion of Flames

* There will be non deterministic behavior for burning. The non determinism maps to the real life phenomena that fire can be extinguished if there is not enough combustible material. The more material (ie. Hay) used to connect between the fire source, and the houses, the more likely the fire will actually connect with the house, and vise versa.  
* There will be an animation for the burning of hay/structures.  
* There will be an animation when fire comes in contact with TNT, the TNT will create an explosion that temporarily spreads fire to a medium sized surrounding area.

## Menu/Splash screen

- The user will see the menu/splash screen first when entering the game  
- The splash screen will feature the name of the game “Burn the Village”  
- There will be 2 buttons below the name of the game: Level select, and level editor.   
- Level select will present a list of levels consisting of the level name and a small thumbnail for the level map and let the user choose what level to play.  
- Level editor is described in detail below.

## Level editor

* The level editor is a WYSIWYG level editor that enables the user to design, test, and play their own levels.  
* It leverages the main gameplay interface with a few changes, the user can specify:  
  * Where the fire source(s) are via the side bar via a click tool  
  * Where the small, medium, large structures are on the map via the side bar via a click tool.  
  * How much Hay and TNT the player will have in the initial state.  
  * Fire/Structures buttons in the sidebar will also have 8bit art representing them.  
  * Name for the level.  
* The user can save the level, the level will be saved in a DB that can be played later via the level select menu.  
* The user can specify the minimum score required to complete the level.  
  * TODO: Implement later, minimum score validation to ensure that the score is attainable given the level design.

## Assets

* There will be assets representing things like fire, hay, TNT, structures, etc. Ensure assets are small and separately defined for easy iteration on them independent of game logic / behavior. Ensure the right folder structure is set up to accommodate this.

## Music / FX

* There will not be music/FX for now, but will be implemented later.
