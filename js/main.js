//script to execute when window is loaded

window.onload = setMap();

//set up choropleth map
function setMap(){

    //map frame dimensions
    var width = 910,
        height = 460;

    //create new svg container for the map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);

    //create Albers equal area projection
    var projection = d3.geo.albersUsa()
        // .center([0,37.24])
        // .rotate([99.18, 0, 0])
        // .parallels([29.5, 45.5])
        .scale(1000)
        .translate([width/2, height/2]);

    var path = d3.geo.path()
      .projection(projection);

    // use d3.queue to parallelize async data load
    d3_queue.queue()
        .defer(d3.csv, "data/2015_allStates.csv") //load attributes from csv file
        .defer(d3.json, "data/us_states.topojson") //load us background map
        .await(callback);

    function callback(error, csvData, usa){

      //create graticule generator
      var graticule = d3.geo.graticule()
          .step([5,5]); //lines every 5 degrees

      //create graticule background
      var gratBackground = map.append("path")
          .datum(graticule.outline())
          .attr("class", "gratBackground")
          .attr("d", path)

      var gratLines = map.selectAll(".gratLines")
          .data(graticule.lines())
          .enter()
          .append("path")
          .attr("class", "gratLines")
          .attr("d", path)

      //translate us topojson
      var usa = topojson.feature(usa, usa.objects.US_states).features;

      //console.log(usa);

      //add US states to map
      var states = map.selectAll(".states")
          .data(usa)
          .enter()
          .append("path")
          .attr("class", function(d){
            return "states " + d.properties.GEOID;
          })
          .attr("d", path);

    };
};
