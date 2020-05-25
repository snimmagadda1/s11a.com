---
title: "A handy responsive CSS snippet"
slug: a-handy-responsive-css-snippet
cover: "https://unsplash.it/400/300/?random?AngelsofMist"
category: "test3"
categories:
  - Code
  - Frontend
date: "03/24/2020"
thumbnail: "../thumbnails/responsive.png"
tags:
  - CSS
  - Grid
  - Flexbox
---

## Starting a collection ...

CSS still scares me. Even after using it everyday for years I'm always fascinated by the number of ways that exist to do something and the new features that come out each year.

[Exhibit A: A quick codepen search](https://codepen.io/search/pens?q=css+art)

I figured a good idea would be to rapid-fire document useful CSS patterns as I use them. Here's a quick and simple one that doesn't need much explaining.

With CSS grid, you can repeat grid columns as you like and place items in them. By using `repeat()` along with `auto-fit`, the browser will handle sizing and wrapping within columns. Similarly, `minmax()` allows you to set constraints on each element. This makes for some interesting applications, i.e a responsive list of objects:

<iframe height="265" style="width: 100%;" scrolling="no" title="Item Container" src="https://codepen.io/snimmagadda1/embed/GRpLMWp?height=265&theme-id=dark&default-tab=result" frameborder="no" allowtransparency="true" allowfullscreen="true">
  See the Pen <a href='https://codepen.io/snimmagadda1/pen/GRpLMWp'>Item Container</a> by Sai Nimmagadda
  (<a href='https://codepen.io/snimmagadda1'>@snimmagadda1</a>) on <a href='https://codepen.io'>CodePen</a>.
</iframe>

Thy styles on the classs `buttonList` demonstrate the result:

```css
.buttonList {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  grid-gap: 1px;
  background: #e1e1e1;
  border-top: 1px solid #e1e1e1;
}
```

(inspect and change size to see, or edit the `max-width` property)

And you could imagine where using something like this might come in handy, i.e if we had an item in a store catalog [(styles from this course)](https://advancedreact.com/):

<iframe height="900" style="width: 100%;" scrolling="no" title="Supreme store item" src="https://codepen.io/snimmagadda1/embed/NWGPaZX?height=900&theme-id=dark&default-tab=result" frameborder="no" allowtransparency="true" allowfullscreen="true">
  See the Pen <a href='https://codepen.io/snimmagadda1/pen/NWGPaZX'>Supreme store item</a> by Sai Nimmagadda
  (<a href='https://codepen.io/snimmagadda1'>@snimmagadda1</a>) on <a href='https://codepen.io'>CodePen</a>.
</iframe>
