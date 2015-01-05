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

Parser.feed = function(data){
	return new Parser(data);
};

Parser.prototype = {
	_convert: function(pstr){
		var rstrs = pstr.split('[');

		var tag = rstrs[0];
		this.tag = tag;

		// if no attributes found
		if(rstrs.length == 1){
			var rstr = '<' + tag + '[^>]*>(.|\\s)*?<\/' + tag + '>';
			return rstr;
		}

		var attrs = rstrs[1].substring(0, rstrs[1].length-1);
		var kvstr = this._convert_kv(attrs);

		var rstr = 
			'<' + tag + '\\s+'		//start of start tag
			+ '[^>]*'				//0 or more attributes
			+ kvstr					//required attributes
			+ '[^>]*'				//0 or more attributes
			+ '>'					//end of start tag
			+ '(.|\\s)*?'					//tag body
			+ '<\/' + tag + '>';	//end tag
		return rstr;

	},
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
	find: function(pstr, onerror){
		var tags = pstr.split(' ');
		var _parser;
		var res = this.data;
		for(var i = 0; i < tags.length; i++){
			var tmp = [];
			for(var j = 0; j < res.length; j++){
				tmp = tmp.concat(this._find(res[j], tags[i]));
			}
			res = tmp;
		}
		_parser = new Parser(res);
		_parser.tag = this.tag;
		return _parser;
	},
	_find: function(data, pstr, onerror){
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
	_get_head_body: function(data){
		var s = data.indexOf('>');
		var e = data.lastIndexOf('<');
		var head = data.substring(0, s+1);
		var body = data.substring(s+1, e);
		return [head, body];
	},
	_get_key_value: function(data){
		var kv = data.split('=');
		var k = kv.shift();
		var v = kv.join('=');
		v = v.substring(1, v.length-1);
		return [k,v];
	},
	_get_attrs: function(data){
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
	parse: function(func){
		for(var i = 0; i < this.size; i++){
			if(this.data[0] == ''){
				func('', {}, '');
			}
			else{
				var hb = this._get_head_body(this.data[i]);
				data = this.data[i];
				innerHTML = hb[1];
				attrs = this._get_attrs(hb[0]);
				func(innerHTML, attrs, data);
			}
		}
	},
	index: function(i){
		if(this.size == 1){
			return this;
		}
		i = i > this.size-1 ? this.size-1 : i;
		var p = new Parser(this.data[i]);
		p.tag = this.tag;
		return p;
	}
};
