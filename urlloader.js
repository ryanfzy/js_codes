var UrlLoader = function(psize){
	this.http = new XMLHttpRequest();
};

UrlLoader.prototype = {
	load: function(url, onsuccess){
		if(!(url instanceof Array)){
			url = [url];
			this.httpr = [];
		}
		for(var i = 0; i < url.length; i++){
			this.httpr.push(new XMLHttpRequest());
		    var loader = this.httpr[i];
		    this.httpr[i].onreadystatechange = function(){
			    var lloader = loader; 
			    if(lloader.readyState == 4 && lloader.status == 200){
				    onsuccess(lloader.responseText);
			    }
		    };
		    this.httpr[i].open('GET', url[i], true);
		    this.httpr[i].send(null);
		}
	},
	_onready: function(onsuccess){
		if(this.http.readyState == 4 && this.http.status == 200){
			onsuccess(loader.http.responseText);
		}
	}
};
