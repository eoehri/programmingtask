// function for parsing parameters in GET request
function getQueryStringParameters(url) {

	var urlParams = {},
	match,
	additional = /\+/g, // Regex for replacing additional symbol with a space
	search = /([^&=]+)=?([^&]*)/g,
	decode = function (s) { return decodeURIComponent(s.replace(additional, " ")); },
	query;

	if (url) {
		if (url.split("?").length > 0) {
			query = url.split("?")[1];
		}
	} else {
		url = window.location.href;
		query = window.location.search.substring(1);
	}

	while (match = search.exec(query)) {
		urlParams[decode(match[1])] = decode(match[2]);
	}

	return urlParams;
}

// assign parameters in GET request 
var urlParams = getQueryStringParameters(),
start = urlParams.start + "000",
end = urlParams.end + "000",
interests = urlParams.cat.toLowerCase().split(" "),
shows = [];

// read dataset and work with it
$.getJSON("./epg_data.json", function(data) {

	/**************************************************************************
	TASK 1: Find a sequence of non-overlapping programs that fit the users interests 
	and are playing between the start and end timestamps
	**************************************************************************/

 	shows = data;
 	console.log("ALL SHOWS IN DATASET:");
 	console.log(shows);

 	// filter shows that are playing/starting in the given timeframe and are matching the user's interest
	var showsFiltered = shows.filter(function (show) {
		return 	show.start >= start 
				&& show.start < end 
				&& interests.some(function(interest) {return show.categories.toLowerCase().indexOf(interest) >= 0; });
	});

	// sort shows ascending based on start time
	var showsFilteredAndSorted = showsFiltered.sort((a, b) => (a.start > b.start) ? 1 : -1)

	// start from beginning and get non-overlapping shows
	var previousShowEnd = 0;
	var showSequence = showsFilteredAndSorted.filter(function (show, i) {
		if (!i) {
			previousShowEnd = show.end;
			return true
		};
		if (show.start >= previousShowEnd) {
			previousShowEnd = show.end;
			return true
		};
	});

	console.log("TASK 1 SEQUENCE:");
	console.log(showSequence);

	/**************************************************************************
	TASK 2: Find a sequence of non-overlapping programs that fit the users interests 
	and are playing between the start and end timestamps, for which the number of 
	times the user changes the channels is maximized
	***************************************************************************/

	// find sequence with maximised zapping (as much non-overlapping shows as possible & sequence so that following channels are not the same as previous channels
	var tempShows = showsFilteredAndSorted,
	otherChannelShows = showsFilteredAndSorted,
	showSequenceMaximised = [];

	while (tempShows.length !== 0) {

		// filter shows that have a channel other than the previous one in the sequence
		if (showSequenceMaximised.length !== 0) {
			otherChannelShows = tempShows.filter(function (show) {
				return show.channel !== showSequenceMaximised[showSequenceMaximised.length - 1].channel
			});
		}

		// find the show with the earliest end time to maximize amount of shows in sequence
		var closestEndTimeShow = otherChannelShows.reduce(function (closestEndTimeShow, show) {
			return (closestEndTimeShow.end) < show.end ? closestEndTimeShow : show;
		}, {});

		// add new show to sequence
		if (Object.entries(closestEndTimeShow).length !== 0) {
			showSequenceMaximised.push(closestEndTimeShow);
		}

		// remove added show from tempShows for further processing
		var index = tempShows.indexOf(closestEndTimeShow);
	    	if (index > -1) {
	       		tempShows.splice(index, 1);
	    	}

	    	// filter shows that have the start time later than the added show to avoid overlapping shows
	    	tempShows = tempShows.filter(function (show) {
			return show.start >= closestEndTimeShow.end
		});
	};

	console.log("TASK 2 SEQUENCE MAXIMISED:");
	console.log(showSequenceMaximised);

	/**************************************************************************
	Create download buttons
	***************************************************************************/
	var task1ResultsButton = document.getElementById('task1results');
	task1ResultsButton.onclick = function() {
	    var element = document.createElement('a');
		element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(showSequence)));
		element.setAttribute('download', "task1_sequence.json");
		element.style.display = 'none';
		document.body.appendChild(element);
		element.click();
		element.remove();
	}

	var task2ResultsButton = document.getElementById('task2results');
	task2ResultsButton.onclick = function() {
	    var element = document.createElement('a');
		element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(showSequenceMaximised)));
		element.setAttribute('download', "task2_sequence_maximized.json");
		element.style.display = 'none';
		document.body.appendChild(element);
		element.click();
		element.remove();
	}
});
