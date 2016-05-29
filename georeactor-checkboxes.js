$(function() {
  var downloaded_layers = {};

  $('input[type="checkbox"]').change(function(e) {
    var layer_id = $(e.currentTarget).attr('name');
    var activate = $(e.currentTarget).prop('checked');
    if (downloaded_layers[layer_id]) {
      if (activate) {
        downloaded_layers[layer_id].addTo(map);
      } else {
        map.removeLayer(downloaded_layers[layer_id]);
      }
    } else if (activate) {
      $(e.currentTarget).prop('disabled', true);
      $.get(layer_id, function(data) {
        try {
          data = JSON.parse(data)
        } catch(e) {
          var rows = data.split(/[\r\n]+/g);

          data = {
            type: 'FeatureCollection',
            features: []
          };

          var headers = rows[0].toLowerCase().split(',');
          var latitude = headers.indexOf('latitude');
          var longitude = headers.indexOf('longitude');

          for (var r = 1; r < rows.length; r++) {
            var row = rows[r].split(',');
            var props = {};
            for (var column = 0; column < row.length; column++) {
              if (column !== latitude && column !== longitude) {
                props[headers[column]] = row[column];
              }
            }
            data.features.push({
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [row[longitude] * 1, row[latitude] * 1]
              },
              properties: props
            });
          }
        }
        console.log(data);
        downloaded_layers[layer_id] = mapJSONfile(data);
        $(e.currentTarget).prop('disabled', false);
      });
    }
  });
});
