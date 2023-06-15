# Base
#[https://github.github.com/gfm/](https://github.github.com/gfm/)
::: details github flavored markdown
[html]<iframe src="https://github.github.com/gfm/" style="width: 100%;height: 80vh;" framespacing="0"></iframe>[/html]
:::

# Additions
## 1. sticker
![sticker](aru/10)![sticker](yellow-face/26)

## 2. images with specific dimension
![favicon with `10rem` width and `unset` height[10rem x ]](/favicon.png)
![favicon with `50%` width and `100px` height[50% x 100px]](/favicon.png)

## 3. paragraph indents
<<>>Indent of paragraph start.

## 4. link with opening in new window
#[google](https://google.com)

## 5. text with color
-(gray: gray text)-
-(#ff0000: red **bold**)-


## 6. text with underline
_(underline *italic*)_
-(red: _(red underline *italic*)_)-

## 7. embed youtube video
[youtube][test youtube video](https://www.youtube.com/embed/LXb3EKWsInQ)[/youtube]

## 8. embed bilibili video
[bili][test bilibili video](https://player.bilibili.com/player.html?aid=626357031&bvid=BV1yt4y1Q7SS&cid=210738676&page=1)[/bili]

## 9. raw html
[html]<del>text</del>[/html]

## 10. fieldset
--title--
```js
const s = 123;
```
-- --

## 11. encrypted block
[encrypt]
will be encrypted during uploading
[/encrypt]

## 12. container block
::: info
some text
:::
::: tip custom title
--inside--
inside block-level element
-- --
:::
::: warning
some text
:::
::: danger
some text
:::
::: details hidden content
[encrypt]
will be encrypted during uploading
[/encrypt]
:::

## 13. embed video/audio
[video][big buck bunny](https://sw-oss.yunyuyuan.net/bigbuckbunny.mp4)[/video]
[video][with poster](https://sw-oss.yunyuyuan.net/bigbuckbunny.jpg|https://sw-oss.yunyuyuan.net/bigbuckbunny.mp4)[/video]
[audio][奥里给](https://sw-oss.yunyuyuan.net/aoligei.mp3)[/audio]

## 14. mathematic formula
* inline level $$F(n) = F(n-1) + F(n-2)$$ formula.
* block level:
$$
F(n) = \begin{cases}
  0, & \text{if } n = 0 \\
  1, & \text{if } n = 1 \\
  F(n-1) + F(n-2), & \text{if } n > 1
\end{cases}
$$

# More
coming...