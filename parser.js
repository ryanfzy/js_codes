var parserjs = (function(){

    var SelectorParser = function(str){
        this.data = str;
        this.curPos = 0;
        this.includeKeys = false;
    };

    SelectorParser.Tag = 'Tag';
    SelectorParser.Attribute = 'Attribute';
    SelectorParser.Value = 'Value';

    SelectorParser.prototype = {
        GetNextToken: function(){
            var token = '';
            var type = '';
            var foundToken = false;
            var foundAttribute = false;
            while(!foundToken || this.curPos == this.data.length-1){
                var ch = this.data[this.curPos];
                if (ch == '['){
                    this.includeKeys = true;
                    type = SelectorParser.Tag;
                    foundToken = token.length > 0;
                }
                else if (ch == ']'){
                    this.includeKeys = false;
                    if (foundAttribute){
                        type = SelectorParser.Value;
                    }
                    else{
                        type = SelectorParser.Attribute;
                    }
                    foundToken = token.length > 0;
                }
                else if (ch == '=' && this.includeKeys){
                    type =SelectorParser.Attribute;
                    foundAttribute = true;
                    foundToken = token.length > 0;
                }
                else if (ch == ' '){
                    if (this.includeKeys){
                        if (foundAttribute){
                            type = SelectorParser.Value;
                        }
                        else{
                            type = SelectorParser.Attribute;
                        }
                        foundToken = token.length > 0;
                    }
                    else{
                        type = SelectorParser.Tag;
                        foundToken = token.length > 0;
                     }
                }
                else{
                    tag += ch;
                }
                this.curPos++;
            }
            return [type, token];
        }
    };

	// data can be a single string
	//   or an array of strings
	var Parser = function(data){
		this.tag = '';
		if(data instanceof Array){
			this.size = data.length;
			this.data = data;
		}
		else{
			this.size = 1;
			this.data = [data];
		}
	};
	
	// return a new Parser
    // @static method
	Parser.Feed = function(data){
		return new Parser(data);
	};
	
	Parser.prototype = {
		// convert the css selector to regex
		_convert: function(pstr){
            /*
			var rstrs = pstr.split('[');
	
			var tag = rstrs[0];
			this.tag = tag;*/
	
			// if no attributes found
			if(rstrs.length == 1){
				var rstr = '<' + tag + '[^>]*>(.|\\s)*?<\/' + tag + '>';
				return rstr;
			}
	
			var attrs = rstrs[1].substring(0, rstrs[1].length-1);
			// convert attributes to regex
			var kvstr = this._convert_kv(attrs);
	
			var rstr = 
				'<' + tag + '\\s+'		//start of start tag
				+ '[^>]*'				//0 or more attributes
				+ kvstr					//required attributes
				+ '[^>]*'				//0 or more attributes
				+ '>'					//end of start tag
				+ '(.|\\s)*?'			//tag body
				+ '<\/' + tag + '>';	//end tag
			return rstr;
	
		},
	
		// convert the attributes to regex
		_convert_kv: function(kvstr){
			var kvs = kvstr.split(' ');
			var res = [];
			for (var i = 0; i < kvs.length; i++){
				var kvstr = kvs[i];
				if(kvstr.search('=') == -1){
					res.push(kvstr + '=');
					continue;
				}
				kvstr = kvstr.replace('=', '="') + '"';
				res.push(kvstr);
			}
			return res.join('[^<>]*');
		},
					
		// reconvert the regex
		//   by replace tag body to the right number of start tags and end tags
		_re_convert: function(rstr, num){
			var st = '<' + this.tag + '\\s+[^>]*>';
			var sb = '(.|\\s)*?';
			var se = '<\/' + this.tag + '>';
			var body = '';
			for(var i = 0; i < num; i++){
				body = sb + st;
			}
			for(var i = 0; i < num; i++){
				body = body + sb + se;
			}
			body += sb;
			rstr = rstr.replace('(.|\\s)*?', body);
	
			return rstr;
		},

        //  TODO: parse string to js object
        // parse the selectors
        _parse_selector: function(pstr){
            var results = [];
            var result = '';
            var includeKeys = false;
            for (var i = 0; i < pstr.length; i++){
                var ch = pstr.charAt(i);
                if (ch == ' ' && !includeKeys){
                    if (result.length > 0){
                        results.push(result);
                        result = '';
                        continue;
                    }
                }
                else if (ch == '[' || (ch == ']' && includeKeys)){
                    includeKeys = !includeKeys;
                }
                result += ch;
            }
            if (result.length > 0){
                results.push(result);
            }
            return results;
        },
	
		// find substring based on css selectors
		Find: function(pstr, onerror){
	
			var tags = this._parse_selector(pstr);
	
			var _parser;
			var res = this.data;
			for(var i = 0; i < tags.length; i++){
				var tmp = [];
	
				for(var j = 0; j < res.length; j++){
					// find the child subtrings for each parent substring
                    var dataitem = res[j];
                    var tagsWithSingleKey = this._parse_single_selector(tags[i]);
                    for (var k = 0; tagsWithSingleKey.length(); k++){
                        dataitem = this._find(dataitem, tagsWithSingleKey[k]);
                    }
					tmp = tmp.concat(dataitem);
				}
				res = tmp;
			}
	
			// create a new Parser from the result and return it
			// this supports method chaining
			_parser = new Parser(res);
			_parser.tag = this.tag;
			return _parser;
		},

        // parse the selector to {tag, key} object
        _parse_single_selector: function(selector){
            var selectors = [];
			var rstrs = pstr.split('[');

			var tag = rstrs[0];
            if (rstrs.length == 1){
                selectors.push({tag: tag});
            }
            else{
			    var attrs = rstrs[1].substring(0, rstrs[1].length-1);
                var attrsArray = attrs.split();
                for (var i = 0; i < attrsArray.length; i++){
                    selectors.push({tag: tag, key: attrsArray[i]});
                }
            }

            return selectors;
        },
	
		// handle single case for find()
		_find: function(data, pstr, onerror){
	
			// convert the selector to regex
			var rstr = this._convert(pstr);
	
			var reg = new RegExp(rstr, 'gi');
			var matches = data.match(reg);
			if(!matches){
				return '';
			}
	
			var mat = matches[0];
			var stag = '<' + this.tag + '\\b';
			var etag = '<\/' + this.tag + '>';
			var sm = mat.match(new RegExp(stag, 'gi')).length;
			var em = mat.match(new RegExp(etag, 'gi')).length;
	
			// handle nested tag
			// if the start tags is more than the tags, nested tags are found
			//   so reconvert the selector
			while(sm > em){
				var nstr = this._re_convert(rstr, sm-1);
				reg = new RegExp(nstr, 'gi');
				matches = data.match(reg);
				mat = matches[0];
				var sm = mat.match(new RegExp(stag, 'gi')).length;
				var em = mat.match(new RegExp(etag, 'gi')).length;
			}
			return matches;
		},
	
		// separate the outermost tag and its innerHTML
		_get_head_body: function(data){
			var s = data.indexOf('>');
			var e = data.lastIndexOf('<');
			var head = data.substring(0, s+1);
			var body = data.substring(s+1, e);
			return [head, body];
		},
	
		// separate key and value
		_get_key_value: function(data){
			var kv = data.split('=');
			var k = kv.shift();
			var v = kv.join('=');
			v = v.substring(1, v.length-1);
			return [k,v];
		},
	
		// convert attrs into object
		_get_attrs: function(data){
            // remove '<' and '>' first
            data = data.substring(1, data.length-1);
			var kvs = data.split(/\s+/);
			var attrs = {};
			for(var i = 0; i < kvs.length; i++){
				var kv = kvs[i];
				if(kv.search('=') == -1){
					continue;
				}
				kv = this._get_key_value(kvs[i]);
				attrs[kv[0]] = kv[1];
			}
			return attrs;
		},
	
		// call the given function for each data items
		// the function is passed with innerHTML, attrs as an object, and raw data string
		Parse: function(func){
			for(var i = 0; i < this.size; i++){
				if(this.data[0] == ''){
					func('', {}, '');
				}
				else{
					// separate outmost tag and its innerHTML
					var hb = this._get_head_body(this.data[i]);
					data = this.data[i];
					innerHTML = hb[1];
					// convert attrs into object
					attrs = this._get_attrs(hb[0]);
					func(innerHTML, attrs, data);
				}
			}
		},
	
		// return a new Parser with a single data item
		Index: function(i){
			if(this.size == 1){
				return this;
			}
			i = i > this.size-1 ? this.size-1 : i;
			var p = new Parser(this.data[i]);
			p.tag = this.tag;
			return p;
		}
    };

    return {
        CreateParser : function(data){
            data = data || "";
            return new Parser(data);
        }
    }

})();

