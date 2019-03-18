var map;

function fitToScreen() {
  Height = $(window).innerHeight();
  $('#map').css('min-height', Height);
  $('#sidebar').css('min-height', Height);
}
fitToScreen();

function ViewModel() {
    var self = this;

    this.locationList = ko.observable("");
    this.markers = [];

    //Populates InfoWindow
    this.populateInfoWindow = function(marker, infowindow) {
      //check that only one infowindow is open.
      if (infowindow.marker != marker) {
        infowindow.setContent('');
        infowindow.marker = marker;
        //Wikipedia API to fetch the locations' information.
        $.ajax({
          type: "GET",
          url: "https://en.wikipedia.org/w/api.php?action=parse&format=json&prop=text&section=0&page="+marker.wikiID+"&callback=?",
          contentType: "application/json",
          async: true,
          dataType: "json",
          success: function (data, textStatus, jqXHR) {
            var markup = data.parse.text["*"];
      	    var rawContent = $('<div></div>').html(markup);
      	    // remove links if any
        	  rawContent.find('a').each(function() { $(this).replaceWith($(this).html()); });
            // remove references if any
      	    rawContent.find('sup').remove();
        	  // remove cite errors if any
        	  rawContent.find('.mw-ext-cite-error').remove();

            $('#wiki_info').html($(rawContent).find('p'));
            self.wikiHTML = $('#wiki_info').html();
            self.wikiText = '';
            //This function extracts plain text from HTML and
            //saves it to 'wikiText' variable.
            function strip(html)
              {
                 var tmp = document.createElement("DIV");
                 tmp.innerHTML = html;
                 self.wikiText =  tmp.textContent || tmp.innerText || "";
              }
            strip(self.wikiHTML);

            if (self.wikiText.length > 150) {
              self.wikiText = self.wikiText.substring(0,150)+'<span id="more" style="display:none;">'+self.wikiText.substring(150,self.wikiText.length)+'</span>'+ '<a href="javascript:readMore();" id="read_more"> ...Read More</a>';
            }

            infowindow.setContent(self.htmlTitle + self.wikiText);
            $('#wiki_info').html(null);
          },
    	    error: function (errorMessage) {
            alert("Problem loading the WikiPedia API");
    	    }
      	});

        this.htmlTitle = '<h3 class="wi_title">'+marker.title+'</h3>';
        infowindow.open(map, marker);

        infowindow.addListener('closeclick', function() {
          infowindow.marker = null;
        });
      }
    };
    //Adds an animation to the infowindow after it gets populated.
    this.popAnimate = function() {
      self.populateInfoWindow(this, self.largeInfoWindow);
      this.setAnimation(google.maps.Animation.DROP);
    };

    this.initMap = function() {
      //Google Map constructor.
      map = new google.maps.Map(document.getElementById('map'),{
        center: {lat: 21.190109, lng: 72.813934},
        zoom: 11
      });
      // Set InfoWindow
      this.largeInfoWindow = new google.maps.InfoWindow({maxWidth: 300});
      for (var i = 0; i < allLocations.length; i++) {
          this.markerTitle = allLocations[i].title;
          this.markerwikiID = allLocations[i].wikiID;
          this.markerLat = allLocations[i].lat;
          this.markerLng = allLocations[i].lng;
          // Creating markers.
          this.marker = new google.maps.Marker({
              map: map,
              position: {
                  lat: this.markerLat,
                  lng: this.markerLng
              },
              title: this.markerTitle,
              lat: this.markerLat,
              lng: this.markerLng,
              wikiID: this.markerwikiID,
              animation: google.maps.Animation.DROP
          });
          this.markers.push(this.marker);
          this.marker.addListener('click', self.popAnimate);
      }
    };

    this.initMap();
    //Creates a list of our locations using 'data-bind'. Also adds the logic for searching locations.
    this.Filter = ko.computed(function() {
      var result = [];
      for (var i = 0; i < this.markers.length; i++) {
        var markerLocation = this.markers[i];
        var str = this.locationList().toLowerCase();
        if (markerLocation.title.toLowerCase().includes(str)) {         //string comparison for search results to be displayed
          result.push(markerLocation);
          this.markers[i].setVisible(true);
        }
        else {
          this.markers[i].setVisible(false);
        }
      }
      return result;
    }, this);
}
//Error handling for Google maps.
function googlemapsError() {
  alert('Problem loading Google maps API!');
}
//initialize the ViewModel and apply bindings.
function initialize() {
  ko.applyBindings(new ViewModel());
}
//Keeps the map and sidebar fitToScreen after any kind of window resizing.
$(window).resize(function() {
  fitToScreen();
});

function readMore() {
  document.getElementById('more').style.display = "block";
  $("#read_more").remove();
}
