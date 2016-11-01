var stringformatterjs = (function(){

    var _forEachCh = function(str, fn){
        for (var i = 0; i < str.length; i++){
            fn(str[i]);
        }
    }

    var _getParam = function(parExp, scope){
        // if parExp is a string, return it
        var regStr = /('|").*?\1/;
        if (regStr.test(parExp)){
            return parExp.substring(1, parExp.length - 1);
        }
        // if parExp is a key in scope, return the value
        else{
            if (parExp in scope){
                return scope[parExp];
            }
        }
        return parExp;
    }

    // return a list
    //   first tiem is a key in scope
    //   remainding items are filter expressions
    var _getParts = function(exp){
        var parts = exp.split('|');

        for (var p = 0; p < parts.length; p++){
            parts[p] = parts[p].trim();
        }

        return parts;
    }

    // return a list
    //   first item is function name
    //   remainding items are function parameters
    var _getFnNameParams = function(fnExp){
        var parts = fnExp.split('(');
        var ret = [parts[0]];

        if (parts.length < 2){
            return ret;
        }

        var params = parts[1].substring(0, parts[1].length-1).split(',');
        for (var p = 0; p < params.length; p++){
            var param = _getParam(params[p].trim());
            ret.push(param);
        }

        return ret;
    }
    
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

            var parts = _getParts(exp);
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
                        //console.log(fNames[n]);
                        var fNameParams = _getFnNameParams(fNames[n]);
                        var fName = fNameParams[0];
                        replace = filter[fName].apply(null, [replace, fNameParams.slice(1)]);
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
