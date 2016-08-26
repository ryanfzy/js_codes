var input = "from 'https://careers.mercyascot.co.nz/home'\n" +
            "select 'div[class=job]' as rets\n" +
            "where-each as ret\n" +
            "from ret.html\n" +
            "select 'div[class=title] a' as href\n" +
            "add-field 'https://careers.mercyascot.co.nz/${href.attrs.href}' for-key '%{HREF}'\n" +
            "and\n" +
            "from ret.html\n" +
            "select 'div[class=title] a span' as title\n" +
            "add-field title.html for-key '%{TITLE}'\n" +
            "and\n" +
            "from ret.html\n" +
            "select 'div[class=description]' as description\n" +
            "add-field description.html for-key '%{DESCRIPTION}'\n" +
            "and\n" +
            "from ret.html\n" +
            "select 'span[class=detail-item]' as [%{LOCATION}, %{EXPERTISE}, %{WORKTYPE}, %{LEVEL}, %{POSTEDDATE}, %{CLOSEDATE}]\n" +
            "where-each as detail\n" +
            "add-field detail.html for-key detail.$Name;";

var HREF = 'href';
var TITLE = 'title';
var DESCRIPTION = 'description';
var LOCATION = 'location';
var EXPERTISE = 'expertise';
var WORKTYPE = 'workType';
var POSTEDDATE = 'postedDate';
var CLOSEDATE = 'closeDate';

var stringformatterjs = (function(){
    var formater = function(str, scope){
        var regKey = /%\{[^{}]+?\}/g;
        var matches = str.match(regKey);
        for (var i = 0; i < matches.length; i++){
            var match = matches[i];
            var key = match.substring(2, match.length-1);
            var replace = match;
            if (key in scope){
                replace = scope[key];
            }
            console.log('match:'+match+';repalce:'+replace);
            str = str.replace(match, replace);
        }
        return str;
    }

    return {
        format : formater
    }
})();

console.log(stringformatterjs.format(input, this));
