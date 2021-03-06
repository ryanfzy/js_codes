parser.js
========

## How To Use:

```
<!-- example html page -->
<html>
<head></head>
<body>
  <div class="title" key="value">
    <p>some text</p>
    <div class="inner">
      <p>some other text</p>
    </div>
  </div>
  <div class="anotherdiv">
    <p>some other text</p>
  </div>
</body>
<html>
```

```
// exmaple.js
var parser = new Parser(data);  // data is the html string, in this case is the example html page
parser.find('div[class=title]');  // this find corresponding element as string
parser.parse(userfunc(innerHTML, attrs, fstr){
  // when more than one substrings are found, userfunc will be called multiple times
  //   fstr is the full substring
  //   attrs is the object representation of the attributes
  //   innerHTML is the substring of fstr without the tag string
  ...
});
/* or */
Parser.feed(data).find('div[class=title]').parse(function(innerHTML, attrs, data){
  console.log(innerHTML);  // => <p>some text</p><div class="inner"><p>some other text</p></div>
  console.log(attrs);      // => {class: title, key: vlaue}
  console.log(data);       // => <div class="title" key="value"><p>some text</p><p>some text</p><div class="inner"><p>some other text</p></div></div>
});
```

urlloader.js
===========

## How To Use:

```
var url = 'http://some.com/web/pages';

var loader = new UrlLoader();
loader.load(url, function(responseText){
  //onsuccess function will return response in plain text
  alert(responseText);
});

var urls = ['http://some.com/web/page1', http://some.com/web/page2'];
var loader = new UrlLoader();
loader.load(urls, function(text){
  //you can pass a array of url, and your onsuccess function will apply to each response
  alert(text);
});
```
