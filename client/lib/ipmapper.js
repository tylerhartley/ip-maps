IPMapper = {

	map: null,

	latlngbound: null,

	infowindow: null,
	
	// baseUrl: "http://freegeoip.net/json/",
	baseUrl: "http://www.telize.com/geoip/",

	initializeMap: function(mapId){
		IPMapper.latlngbound = new google.maps.LatLngBounds();
		var latlng = new google.maps.LatLng(0, 0);
		//set Map options
		var mapOptions = {
			zoom: 2,
			center: latlng,
			mapTypeId: google.maps.MapTypeId.ROADMAP,
		}
		//init Map
		IPMapper.map = new google.maps.Map(document.getElementById(mapId), mapOptions);
		//init info window
		IPMapper.infowindow = new google.maps.InfoWindow();
		//info window close event
		google.maps.event.addListener(IPMapper.infowindow, 'closeclick', function() {
			IPMapper.map.fitBounds(IPMapper.latlngbound);
			IPMapper.map.panToBounds(IPMapper.latlngbound);
		});
	},
	parseAndPlotIPAddress: function(ip){
		ip = $.trim(ip); // remove whitespace
		ipRegex = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/;
		// If the IP address fits the test regex pattern,
		if(ip != '' && ipRegex.test(ip)){ 
			var url = encodeURI(IPMapper.baseUrl + ip + "?callback=?"); 
			// Send GET request to telize for geocoded JSONP data
			$.getJSON(url, function(data) { 
				if($.trim(data.latitude) != '' && data.latitude != '0' && !isNaN(data.latitude)){ //Geocoding successfull
					// Parse all key, val pairs to place inside the marker window on click
					var contentString = "";
					$.each(data, function(key, val) {
						contentString += '<b>' + key.toUpperCase().replace("_", " ") + ':</b> ' + val + '<br />';
					});
					// Add this IP address and geolocation to the mongodb
					IPAddresses.insert({
			          ip: ip,
			          createdAt: new Date(), // current time
			          latitude: data.latitude,
			          longitude: data.longitude,
			          contentString: contentString,
			          city: data.city,
			          country: data.country,
			        });
					// Actually go about plotting on a map
			        IPMapper.addIPMarker(data.latitude, data.longitude, contentString)
				} else {
					IPMapper.logError('IP Address geocoding failed!');
					$.error('IP Address geocoding failed!');
					}
				});
		}
		else {
			IPMapper.logError('Invalid IP Address!');
			$.error('Invalid IP Address!');
		}
	},
	addIPMarker: function(latitude, longitude, contentString){
		// Display the marker on the map
		var latlng = new google.maps.LatLng(latitude, longitude);
		var marker = new google.maps.Marker({ //create Map Marker
			map: IPMapper.map,
			draggable: false,
			position: latlng
		});
		// place Marker on Map
		IPMapper.placeIPMarker(marker, latlng, contentString); 
	},
	placeIPMarker: function(marker, latlng, contentString){ 
		//place Marker on Map
		marker.setPosition(latlng);
		google.maps.event.addListener(marker, 'click', function() {
			IPMapper.getIPInfoWindowEvent(marker, contentString);
		});
		IPMapper.latlngbound.extend(latlng);
		IPMapper.map.setCenter(IPMapper.latlngbound.getCenter());
		IPMapper.map.fitBounds(IPMapper.latlngbound);
	},
	getIPInfoWindowEvent: function(marker, contentString){ 
		//open Marker Info Window
		IPMapper.infowindow.close()
		IPMapper.infowindow.setContent(contentString);
		IPMapper.infowindow.open(IPMapper.map, marker);
	},
	logError: function(error){
		if (typeof console == 'object') { console.error(error); }
	}
}