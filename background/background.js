var sEI = {
	google: "https://www.google.com/search?",
	yahoo: "https://search.yahoo.com/search?",
	bing: "https://www.bing.com/search?",
	ask: "https://www.ask.com/web?",
	aol: "https://search.aol.com/aol/search?"
};

var websiteTemplates = {
	// search engines
	google: "https://www.google.com/search?q=%s",
	yahoo: "https://search.yahoo.com/search?p=%s",
	bing: "https://www.bing.com/search?q=%s",
	ask: "https://www.ask.com/web?q=%s",
	aol: "https://search.aol.com/aol/search?q=%s",
	baidu: "https://www.baidu.com/s?wd=%s",
	yandex: "https://yandex.com/search/?text=%s",
	// google services
	google_drive: "https://drive.google.com/drive/u/0/search?q=%s",
	// dev stuff
	github: "https://github.com/search?q=%s&ref=opensearch",
	// social networks
	facebook: "https://www.facebook.com/search/top/?q=%s",
	instagram: "https://instagram.com/explore/tags/%s", // only works for one term
	twitter: "https://twitter.com/search?q=%s",
	reddit: "https://www.reddit.com/search?q=%s",
	pinterest: "https://www.pinterest.com/search/pins/?q=%s",
	tumblr: "https://www.tumblr.com/search/%s",
	// wiki
	wikipedia: "https://en.wikipedia.org/w/index.php?search=%s",
	// online shopping
	taobao: "https://s.taobao.com/search?q=%s",
	amazon: "https://www.amazon.com/s/field-keywords=%s",
	tmall: "https://list.tmall.com/search_product.htm?q=%s",
	ebay: "https://www.ebay.com/sch/i.html?_nkw=%s",
	// video services
	netflix: "http://dvd.netflix.com/Search?v1=%s",
	youtube: "https://www.youtube.com/results?search_query=%s",
	twitch: "https://www.twitch.tv/%s", // searches users only
	// music services
	spotify: "https://open.spotify.com/search/results/%s",
	// blog services
	blogspot: "https://www.searchblogspot.com/search?q=%s",
	medium: "https://medium.com/search?q=%s"
};

chrome.runtime.onInstalled.addListener(function (details) {
	if (details.reason == "install") {
		chrome.storage.sync.set({
			commandIndex: websiteTemplates
		}); // async
	} else if (details.reason == "update") {
		var thisVersion = chrome.runtime.getManifest().version;
		console.log("Updated from " + details.previousVersion + " to " + thisVersion + "!");
	}
});

chrome.storage.onChanged.addListener(function (changes, namespace) {
	websiteTemplates = changes["commandIndex"].newValue;
});

function parseQueryString(query) {
	var vars = query.split("&");
	var query_string = {};
	for (var i = 0; i < vars.length; i++) {
		var pair = vars[i].split("=");
		var key = decodeURIComponent(pair[0]);
		var value = decodeURIComponent(pair[1]);
		// If first entry with this name
		if (typeof query_string[key] === "undefined") {
			query_string[key] = value;
			// If second entry with this name
		} else if (typeof query_string[key] === "string") {
			var arr = [query_string[key], value];
			query_string[key] = arr;
			// If third or later entry with this name
		} else {
			query_string[key].push(value);
		}
	}
	return query_string;
}

function searchEngineOfUrl(url) {
	if (url.indexOf(sEI.google) !== -1) {
		return "google";
	} else if (url.indexOf(sEI.yahoo) !== -1) {
		return "yahoo";
	} else if (url.indexOf(sEI.bing) !== -1) {
		return "bing";
	} else if (url.indexOf(sEI.ask) !== -1) {
		return "ask";
	} else if (url.indexOf(sEI.aol) !== -1) {
		return "aol";
	} else {
		return false;
	}
}

//chrome.tabs.onCreated.addListener(getSearchQueries);
chrome.tabs.onUpdated.addListener(getSearchQueries);


function getSearchQueries(tabId, changeInfo) {
	var tabUrl = changeInfo.url;
	if (tabUrl) {
		var urlSearchEngine = searchEngineOfUrl(tabUrl);
		if (urlSearchEngine) {
			var searchQuery;
			switch (urlSearchEngine) {
				// each case checks to make sure the search was conducted from the chrome search bar
				case "google":
					var urlParameters = parseQueryString(tabUrl.replace(sEI.google, ""));
					if (urlParameters.q && urlParameters.sourceid === "chrome") {
						searchQuery = urlParameters.q;
					}
					break;
				case "yahoo": // doesnt work when called from yahoo search bar, so its safe
					var urlParameters = parseQueryString(tabUrl.replace(sEI.yahoo, ""));
					if (urlParameters.p) {
						searchQuery = urlParameters.p;
					}
					break;
				case "bing":
					var urlParameters = parseQueryString(tabUrl.replace(sEI.bing, ""));
					if (urlParameters.q && urlParameters.FORM === "CHROMN") {
						searchQuery = urlParameters.q;
					}
					break;
				case "ask":
					var urlParameters = parseQueryString(tabUrl.replace(sEI.ask, ""));
					if (urlParameters.q && !urlParameters.qo) {
						searchQuery = urlParameters.q;
					}
					break;
				case "aol": // doesnt work when called from aol search bar, so its safe
					var urlParameters = parseQueryString(tabUrl.replace(sEI.aol, ""));
					if (urlParameters.q) {
						searchQuery = urlParameters.q;
					}
					break;
			}
			if (searchQuery) {
				// is a search query!
				var searchElements = searchQuery.split("+");
				var searchUrl = websiteTemplates[searchElements[0]];
				if (searchUrl) {
					searchElements.shift(); // remove first word of search query
					var newUrl = searchUrl.replace("%s", searchElements.join("+"));
					chrome.tabs.update(tabId, {
						url: newUrl
					});
				} // if it is not looking for anything interesting, just leave it be
			}
		}
	}
}