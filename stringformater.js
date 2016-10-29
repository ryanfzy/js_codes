var stringformatterjs = (function(){
    
    // str is the replacing string
    // scope is an object that contains the values of the keys in the replacing string
    // therefore, for some <key> in <str>, <scope>[<key>] has the <replacing-value>
    var formater = function(str, scope, filter){

        // identify for the replacing strings, e.g. %{somekey}
        var regKey = /%\{[^{}]+?\}/g;
        var matches = str.match(regKey);
        
        for (var i = 0; i < matches.length; i++){
            var match = matches[i];
            var exp = match.substring(2, match.length-1);

            var parts = exp.split('|');
            
            // remove spaces at the ends of the key
            for (var p = 0; p < parts.length; p++){
                parts[p] = parts[p].trim();
            }

            // first part is the key
            var key = parts[0];

            // if scope has the value for the key, replace the key
            // otherwise, keep as it is
            var replace = match;
            if (key in scope){
                replace = scope[key];

                // if user providers a filter, filter the replace string
                if (filter && parts.length > 1){
                    var fNames = parts.slice(1)
                    for (var n = 0; n < fNames.length; n++){
                        var fName = fNames[n];
                        var replace = filter[fName](replace);
                    }
                }
            }

            str = str.replace(match, replace);
        }

        return str;
    }

    return {
        format : formater
    }
})();
