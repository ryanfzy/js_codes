var stringformatterjs = (function(){
    // str is the replacing string
    // scope is an object that contains the values of the keys in the replacing string
    // therefore, for some <key> in <str>, <scope>[<key>] has the <replacing-value>
    var formater = function(str, scope){
        // identify for the replacing strings, e.g. %{somekey}
        var regKey = /%\{[^{}]+?\}/g;
        var matches = str.match(regKey);
        for (var i = 0; i < matches.length; i++){
            var match = matches[i];
            var key = match.substring(2, match.length-1);
            // if scope has the value for the key, replace the key
            // otherwise, keep as it is
            var replace = match;
            if (key in scope){
                replace = scope[key];
            }
            str = str.replace(match, replace);
        }
        return str;
    }

    return {
        format : formater
    }
})();
