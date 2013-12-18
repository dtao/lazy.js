[Lazy.js](http://danieltao.com/lazy.js/)是类似[Underscore](http://underscorejs.org/)或[Lo-Dash](http://lodash.com/)的JavaScript工具库，但是它有一个非常独特的特性：**惰性求值**。很多情况下，惰性求值都将带来巨大的性能提升，特别是当处理巨大的数组和连锁使用多个方法的时候。

与Underscore、Lo-Dash的比较：

![](http://i.imgur.com/9vP6sVG.png)

当数组非常大的时候，对于不需要迭代整个数组的方法，例如`indexOf`和`take`，Lazy.js的性能提升更为惊人：

![](http://i.imgur.com/oGPlPug.png)

安装
----

Lazy.js没有外部依赖，所以加载Lazy.js非常方便：

```html
<script type="text/javascript" src="lazy.js"></script>
```

如果你希望支持DOM事件序列的惰性求值，那么用这个：

```html
<script type="text/javascript" src="lazy.browser.js"></script>
```

如果你使用Node.js：

```sh
npm install lazy.js
```


简介
----

我们创建一个包含1000个整数的数组：

```js
var array = Lazy.range(1000).toArray();
```

注意我们调用了`toArray`。如果没有这个，`Lazy.range`给我们的将不是一个数组而是一个`Lazy.Sequence`对象，你可以通过`each`来迭代这个对象。

现在我们打算取每个数字的平方，增加一下，最后取出前5个偶数。为了保持代码简短，我们使用这些辅助函数：

```js
function square(x) { return x * x; }
function inc(x) { return x + 1; }
function isEven(x) { return x % 2 === 0; }
```

这是一个奇怪的目标。不管怎么样，我们可以用Underscore的`chain`方法实现它：

```js
var result = _.chain(array).map(square).map(inc).filter(isEven).take(5).value();
```

注意上面这行语句做了多少事情：

- `map(square)`迭代了整个数组，创建了一个新的包含1000个元素的数组
- `map(inc)`迭代了新的数组，创建了另一个新的包含1000个元素的数组
- `filter(isEven)`迭代了整个数组，创建了一个包含500个元素的新数组
- `take(5)`这一切只是为了5个元素！


如果你需要考虑性能，你可能不会这么干。相反，你会写出类似这样的过程式代码：

```js
var results = [];
for (var i = 0; i < array.length; ++i) {
  var value = (array[i] * array[i]) + 1;
  if (value % 2 === 0) {
    results.push(value);
    if (results.length === 5) {
      break;
    }
  }
}
```

现在我们没有创建任何多余的数组，在一次迭代中完成了一切。有什么问题么？

好吧。最大的问题在于这是一次性的代码，我们花了一点时间编写了这段代码，却无法复用。要是我们能够利用Underscore的表达力，同时得到手写的过程式代码的性能，那该多好啊！

这就是Lazy.js该发威的时候了。用 Lazy.js，上面的代码会写成：

```js
var result = Lazy(array).map(square).map(inc).filter(isEven).take(5);
```

看上去和用Underscore的代码几乎一样？正是如此：Lazy.js希望带给JavaScript开发者熟悉的体验。每个Underscore的方法应该和Lazy.js有相同的名字和表现，唯一的不同是Lazy.js返回一个序列对象，以及相应的`each`方法。

重要的是，**直到你调用了`each`才会产生迭代**，而且**不会创建中间数组**。 Lazy.js将所有查询操作组合成一个序列，最终的表现和我们开始写的过程式代码差不多。

当然，与过程式代码不同的是，Lazy.js确保你的代码是干净的，函数式的。这样你就可以专注于构建应用，而不是优化遍历数组的代码。

特性
----

酷！Lazy.js还能做什么？

### 生成无穷序列

是的，无穷序列，无穷无尽！同样支持所有Lazy内建的map和filter功能。

看个例子吧。假设我们需要在1和1000之间获取300个不同的随机数：

```js
var uniqueRandsFrom1To1000 = Lazy.generate(function() { return Math.random(); })
  .map(function(e) { return Math.floor(e * 1000) + 1; })
  .uniq()
  .take(300);

// 输出：亲眼看看吧
uniqueRandsFrom1To1000.each(function(e) { console.log(e); });
```

相当不错。换一个高级点的例子吧。让我们用Lazy.js创建一个斐波那契数列。

```js
var fibonacci = Lazy.generate(function() {
  var x = 1,
      y = 1;
  return function() {
    var prev = x;
    x = y;
    y += prev;
    return prev;
  };
}());

// 输出: undefined
var length = fibonacci.length();

// 输出: [2, 2, 3, 4, 6, 9, 14, 22, 35, 56]
var firstTenFibsPlusOne = fibonacci.map(inc).take(10).toArray();
```

不错，还有什么？

异步迭代
--------

你以前多半见过如何在JavaScript中异步迭代数组的[代码片段](https://gist.github.com/dtao/2351944)。但是你见过这样的吗？

```js
var asyncSequence = Lazy(array)
  .async(100) // 100毫秒
  .map(inc)
  .filter(isEven)
  .take(20);

//  这个函数会马上返回，然后开始异步迭代
asyncSequence.each(function(e) {
  console.log(new Date().getMilliseconds() + ": " + e);
});
```

很好。还有吗？

事件序列
--------

我们看到，和Underscore和Lo-Dash不同，对于无穷序列，Lazy.js并不需要把一个把所有数据放到内存以便迭代。异步序列也显示了它并不需要一次完成所有迭代。

现在我们要介绍一个Lazy.js的小扩展`lazy.browser.js`（基于浏览器的环境需要包含一个单独的文件），它组合了以上两个特性，现在，处理DOM事件也可以使用Lazy.js的力量了。换句话说，Lazy.js让你把DOM事件看成是一个序列——和其他序列一样——然后可以将那些用于序列的函数`map`和`filter`应用到序列上。

下面是一个例子。比如我们打算处理给定的DOM元素的所有`mousemove`事件，同时显示它们的坐标。

```js
// 首先我们定义事件序列
var mouseEvents = Lazy.events(sourceElement, "mousemove");

// 将事件序列和坐标相map
var coordinates = mouseEvents.map(function(e) {
  var elementRect = sourceElement.getBoundingClientRect();
  return [
    Math.floor(e.clientX - elementRect.left),
    Math.floor(e.clientY - elementRect.top)
  ];
});

// 对于在元素一边的鼠标事件，在一个地方显示坐标
coordinates
  .filter(function(pos) { return pos[0] < sourceElement.clientWidth / 2; })
  .each(function(pos) { displayCoordinates(leftElement, pos); });

// 对于元素另一边的鼠标事件，在另一处显示坐标
coordinates
  .filter(function(pos) { return pos[0] > sourceElement.clientWidth / 2; })
  .each(function(pos) { displayCoordinates(rightElement, pos); });
```

还有么？当然！

字符串处理
----------

这可能是你不会想到过的东西：`String.match`和`String.split`。在JavaScript中，这两个方法会返回包含子字符串的数组。如果你这么做，通常意味着JavaScrit会做一些不必要的事。但是从开发者的角度而言，这是完成任务最快的方法。

例如，你想从一段文本中抽取出前5行。你当然可以这么做：

```js
var firstFiveLines = text.split("\n").slice(0, 5);
```

当然，这意味着将整个字符串分割成单行。如果这个字符串非常大，这很浪费。

有了`Lazy.js`，我们不用分割整个字符串，我们只需将它看成行的序列。将字符串用`Lazy`包裹之后再调用`split`，可以取得同样的效果：

```js
var firstFiveLines = Lazy(text).split("\n").take(5);
```

这样我们就可以读取任意大小的字符串的前5行（而不需要预先生成一个巨大的数组），然后像对其他序列一样使用`map/reduce`。

`String.match`同理。例如我们需要找出字符串中最前面5个数字或字母。使用`Lazy.js`，这很容易！

```js
var firstFiveWords = Lazy(text).match(/[a-z0-9]+/i).take(5);
```

小菜一碟。

流处理
------

在Node.js中，Lazy.js同样可以封装流。

给定一个[可读流](http://nodejs.org/api/stream.html#stream_class_stream_readable)，你可以像封装数组一样用`Lazy`包裹一番：

```js
Lazy(stream)
  .take(5) // 仅仅阅读数据中的前五块内容
  .each(processData);
```

为了方便，Lazy.js也提供了处理文件流和HTTP流的专门辅助方法。（注意：API未来可能会改变。）

```js
// 读取文件的前5行
Lazy.readFile("path/to/file")
  .lines()
  .take(5)
  .each(doSomething);

// 从HTTP响应中读取5-10行
Lazy.makeHttpRequest("http://example.com")
  .lines()
  .drop(5)
  .take(5)
  .each(doSomething);
```

`lines()`方法将每段切割成行（当然了，切割是惰性的）。

----

Lazy.js是试验性的，仍在开发中。[项目主页在此](http://danieltao.com/lazy.js/)
