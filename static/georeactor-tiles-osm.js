function initTileView() {
  $("#loading").hide();
  var editButton = $("<button class='btn'>Edit OSM</button>").click(function() {
    var center = map.getCenter();
    var zoom = map.getZoom();
    if (zoom < 16) {
      return alert("Zoom in for more detail before opening the OSM editor");
    }
    window.location.href = "http://www.openstreetmap.org/edit?editor=id#map=" + [Math.round(zoom), center.lat, center.lng].join("/") + "&background=custom:https://b.tiles.mapbox.com/v4/planemad.ba506c30/{z}/{x}/{y}.png%3Faccess_token=pk.eyJ1IjoicGxhbmVtYWQiLCJhIjoiemdYSVVLRSJ9.g3lbg_eN0kztmsfIPxa9MQ";
  });
  $("#sidebar").append(editButton);
}
