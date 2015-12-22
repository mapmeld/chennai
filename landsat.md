// Load a raw Landsat 5 ImageCollection for a single path and row.
var collection = ee.ImageCollection('LANDSAT/LT5_L1T');

// Create a cloud-free composite with default parameters.
var composite = ee.Algorithms.Landsat.simpleComposite({
  collection: collection.filterDate('1987-3-1', '1989-3-1')
});

// Display the composites.
Map.addLayer(composite, {bands: ['B7', 'B5', 'B1'], max: 100});


// Composite 6 months of Landsat 8.

// Pick a spot with lots of clouds.

var L8 = ee.ImageCollection('LANDSAT/LC8_L1T');

// "asFloat: true" gives proper (floating-point) TOA output instead of
// the mangled-to-UINT8 outputs of the original simpleComposite().
var composite = ee.Algorithms.Landsat.simpleComposite({
  collection: L8.filterDate('2015-1-1', '2015-7-1'),
  asFloat: true});

Map.addLayer(composite, {bands: 'B7,B6,B2', max: [0.3, 0.4, 0.3]});
