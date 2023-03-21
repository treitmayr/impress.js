Relative Positioning Plugin
===========================

This plugin provides support for defining the coordinates of a step relative
to previous steps. This is often more convenient when creating presentations,
since as you add, remove or move steps, you may not need to edit the positions
as much as is the case with the absolute coordinates supported by impress.js
core.

Examples:

```html
<!-- Position step 1000 px to the right and 500 px up from the previous step. -->
<div class="step" data-rel-x="1000" data-rel-y="500">

<!-- Position step 1000 px to the left and 750 px up from the step with id "title". -->
<div class="step" data-rel-x="-1000" data-rel-y="750" data-rel-to="title">

<!-- Position step inside the previous step, 100 px from its left border. -->
<div class="step" data-rel-reset data-rel-align-x="in-left" data-rel-x="100">
```

Following html attributes are supported for step elements:

    data-rel-x
    data-rel-y
    data-rel-z
    data-rel-to

    data-rel-rotate-x
    data-rel-rotate-y
    data-rel-rotate-z

    data-rel-align-x
    data-rel-align-y

    data-rel-position
    data-rel-reset

Non-zero values are also inherited from the previous step. This makes it easy to 
create a boring presentation where each slide shifts for example 1000px down 
from the previous.

The above relative values are ignored, or set to zero, if the corresponding 
absolute value (`data-x` etc...) is set. Note that this also has the effect of
resetting the inheritance functionality.

In addition to plain numbers, which are pixel values, it is also possible to
define relative positions as a multiple of screen height and width, using
a unit of "h" and "w", respectively, appended to the number.

Example:

```html
<div class="step" data-rel-x="1.5w" data-rel-y="1.5h">
```

Note that referencing a special step with the `data-rel-to` attribute is *limited to previous steps* to avoid the possibility of circular or offending positioning.
If you need a reference to a step that is shown later make use of the goto plugin:

```html
<div id="shown-first" class="step" data-goto-next="shown-earlier">
<div id="shown-later" class="step" data-goto-prev="shown-earlier" data-goto-next="shown-last">
<div id="shown-earlier" class="step" data-rel-to="shown-later" data-rel-x="1000" data-rel-y="500" data-goto-prev="shown-first" data-goto-next="shown-later">
<div id="shown-last" class="step" data-goto-prev="shown-later">
```

Relative positioning
--------------------

All `data-rel-x`/`y`/`z` use world coordinates by default. So the value should be alternated according to the rotation state of previous slides.

To facilitate relative positioning, the `data-rel-position` attribute is introduced.

`data-rel-position` has a default value of "absolute", which works like this attribute is not introduced.

When `data-rel-position="relative"`, everything changes. The rotation of previous is no need to be considered, you can set all the `data-rel-` attributes as if the previous has no rotation. This plugin will calculate the acual position according to the position and rotation of the previous slide and the relative settings. This make it possible to split a presentation into parts, construct each parts standalone without consider the final position, and then assemble them together.

For example, if you want the slide slided in from the right hand side, all you need is `data-rel-x="1000"`, no matter the rotation of the previous slide. If the previous slide has `data-rotate-z="90"`, the actual attribute of this slide will work like `data-rel-y="1000"`.

Not only relative positions, the relative rotations can be used while `data-rel-position="relative"`.

For example, `data-rel-rotate-y="45"` will make the slide has an angle of 45 degree to the previous slide. It make it easy to build a circle and do other complicated positioning.

If not set, the `data-rel-position` attribute will be inherited from previous slide. So we only need to set it at the first slide, then all done.

To avoid the boring need to set most `data-rel-*` to zero, but set only one or two ones, `data-rel-reset` attribute can be used: 

- `data-rel-reset` equals to: `data-rel-x="0" data-rel-y="0" data-rel-z="0" data-rel-rotate-x="0" data-rel-rotate-y="0" data-rel-rotate-z="0" data-rel-align-x="mid" data-rel-align-y="mid"`
- `data-rel-reset="all"` works like `data-rel-reset`, in additions `data-rotate-x="0" data-rotate-y="0" data-rotate-z="0"`

When `data-rel-position="relative"` and `data-rel-to` is specified, `data-rotate-*` and `data-rel-*` will be inherited from specified slide too.

Alignment to reference step
---------------------------
Before applying the described relative positioning, a step may be aligned to the boundaries of its reference step (previous step or `data-rel-to` step). The alignment can be specified independently for the x and y axis via the attributes `data-rel-align-x` and
`data-rel-align-y`. For each axis a different set of tokens may be specified, separated by "-" (dash):

* X axis: One of `left`, `right`, `mid` (default) plus one of `in`, `out`.
* X axis: One of `top`, `bottom`, `mid` (default) plus one of `in`, `out`.

Note that when looking at the [box model](https://www.w3.org/TR/css-box-3/#box-model) of the aligned steps, `in` will align the inner boundaries of the reference step's border with the outer boundary of the step's borders, i.e. boarders will not overlap but stick next to each other. For `out` the outer boundaries of the margins will align but collapse to the margin with the bigger value.

Examples:

* `data-rel-align-x="right-out" data-rel-align-y="top-in"`

  This will align the step's left side on the right side of its preceding step, and align their top borders.

* `data-rel-align-x="mid" data-rel-align-y="bottom-in"`

  This will align the step's bottom border to the bottom border of its preceding step, and will keep it horizontally centered.

<iframe src="../../../../Referat-3.html"></iframe>


IMPORTANT: Incompatible change
------------------------------

Enabling / adding this plugin has a small incompatible side effect on default values.

Prior to this plugin, a missing data-x/y/z attribute would be assigned the default value of 0.
But when using a version of impress.js with this plugin enabled, a missing data-x/y/z attribute
will inherit the value from the previous step. (The first step will inherit the default value of 0.)

For example, if you have an old presentation with the following 3 steps, they would be positioned
differently when using a version of impress.js that includes this plugin:

    <div class="step" data-x="100" data-y="100" data-z="100"></div>
    <div class="step" data-x="100" data-y="100"></div>
    <div class="step" data-x="100" data-y="100"></div>

To get the same rendering now, you need to add an explicit `data-z="0"` to the second step:

    <div class="step" data-x="100" data-y="100" data-z="100"></div>
    <div class="step" data-x="100" data-y="100" data-z="0"></div>
    <div class="step" data-x="100" data-y="100"></div>

Note that the latter code will render correctly also in old versions of impress.js.

If you have an old presentation that doesn't use relative positioning, and for some reason you
cannot or don't want to add the explicit 0 values where needed, your last resort is to simply
remove the `rel.js` plugin completely. You can either:

* Remove `rel.js` from [/build.js](../../../build.js) and recompile `impress.js` with: `npm build`
* Just open [/js/impress.js] in an editor and delete the `rel.js` code.
* Or, just uncomment the following single line, which is the last line of the plugin:

        impress.addPreInitPlugin( rel );


About Pre-Init Plugins
----------------------

This plugin is a *pre-init plugin*. It is called synchronously from impress.js
core at the beginning of `impress().init()`. This allows it to process its own
data attributes first, and possibly alter the data-x, data-y and data-z attributes
that will then be processed by `impress().init()`.

(Another name for this kind of plugin might be called a *filter plugin*, but
*pre-init plugin* is more generic, as a plugin might do whatever it wants in
the pre-init stage.)


Author
------

Henrik Ingo (@henrikingo), 2016
