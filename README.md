parser.js
========

## How To Use:

```
var parser = new Parser(data);  // data is the html string
parser.find('div[class=title]');  // this find corresponding substring
parser.parse(userfunc(index, attrs, fstr){
  // when more than one substrings are found, userfunc will be called multiple times
  //   fstr is the full substring
  //   attrs is the object representation of the substring
  //   index is the index of fstr in the result of .find()
  ...
});
/* or */
Parser.feed(data).find('div[class=title]').parse(function(index, attrs, data){
  ...
};
```
