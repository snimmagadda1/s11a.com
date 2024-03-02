---
title: "T.I.G: JavaScript push to the beginning of an array"
slug: javascript-push-to-the-beginning-of-an-array
cover: "https://unsplash.it/400/300/?random?AngelsofMist"
category: "test3"
categories:
  - ThingsIGoogled
  - Code
date: "11/18/2020"
thumbnail: "../thumbnails/google.png"
tags:
  - JavaScript
  - ES6
  - Spread
  - Set
time: "2 min"
type: "post"
---

## Things I googled ...

I've decided to document random things that I google or put together after a few google searches. I figured if folks find it helpful, then that's awesome. Regardless, writing stuff down has always helped me remember things long term. I tend to re-google. A lot. So this is what spurred the search:

Today I was building an admin UI component in an Angular webapp. The component itself was built by binding a large array of objects into a Material data table and each row itself had a series of inputs and toggles. The interface was meant to support CRUD operations for objects in the array. It was working great during my tests, but I quickly realized the editing experience was a bit tedious when a user went to add a new element and the number of elements in the list was already very large. The user had to scroll all the way to the bottom after clicking the '+' button to continue with the newly presented form element. That was because my JS was using `push` to append the new objects. Big duh moment, so I googled for the nth time how to add objects to the beginning of a JS array:

```typescript

let add = (newValue) =>{
    myObjects.unshift()
}

let myObjects = [
    {id: 1, name: 'obj1', createDate: '11-18-2020', enabled: true},
    {id: 2, name: 'obj2', createDate: '03-02-2020', enabled: true},
    {id: 3, name: 'obj3', createDate: '01-22-2020', enabled: false}
    ...
]

myObjects.unshsift({})
```

Easy user experience win.
