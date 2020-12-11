---
title: "Rapid development & accessible dropdowns with Downshift "
slug: rapid-development-and-accessible-dropdowns-with-downshit
cover: "https://unsplash.it/400/300/?random?AngelsofMist"
category: "test3"
categories:
  - Code
  - Frontend
date: "12/10/2020"
thumbnail: "../thumbnails/downshift.png"
tags:
  - JavaScript
  - styled-components
  - downshift
  - react
---

## Flexible and fast development

Admittedly, I'm probably a bit late to the game on this one, but I stumbled on downshift and have been impressed! Developing with it feels _fast_. It offers so many features out of the box and uses render props. Render props are great because they decouple implementation details with the content being rendered, and after using this for a couple hours I am thrilled with the low-level control this puts in a developer's hands. Lets take this example, building a dropdown that searches onChange:

```jsx
  render() {
    const items = this.state.items;
    return (
      <div className="container">
            <span>
              <InputStyles collapsed={items.length === 0}>
                <input
                  type="search"
                  name="search"
                  placeholder="Search for your fav streamer..."
                  onChange={(e) => {
                    e.persist();
                    this.onChange(e)
                  }}
                />
                <ButtonStyles disabled>
                  <svg
                    version="1.1"
                    viewBox="0 0 20 20"
                    x="0px"
                    y="0px"
                    className="svg"
                  >
                    <g>
                      <path
                        fillRule="evenodd"
                        d="M13.192 14.606a7 7 0
                        111.414-1.414l3.101 3.1-1.414
                        1.415-3.1-3.1zM14 9A5 5 0 114
                        9a5 5 0 0110 0z"
                        clipRule="evenodd"
                      ></path>
                    </g>
                  </svg>
                </ButtonStyles>
              </InputStyles>
                <DropDown>
                  {items.map((item, ind) => (
                    <DropDownItem
                      key={ind}
                      last={ind === items.length - 1}
                    >
                      {this.getVideoThumbnail(item)}
                      <div className="info">
                        <h4>{item.title}</h4>
                        <small>{item.creator_name}</small>
                      </div>
                    </DropDownItem>
                  ))}
                  {!items.length === 0 && !this.state.loading && (
                    <DropDownItem>
                      {" "}
                      No clips found ...
                    </DropDownItem>
                  )}
                </DropDown>
            </span>
      </div>
    );
  }
```

![Dropdown render output expanded with results](../images/before.png)
