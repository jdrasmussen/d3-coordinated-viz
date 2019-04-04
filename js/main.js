//script to execute when window is loaded
(function(){
//pseudo-global variables
//variables for data join
var attrArray = ["GEOID", "ENROLL", "TOTAL_REVENUE", "FEDERAL_REVENUE",
"STATE_REVENUE", "LOCAL_REVENUE", "TOTAL_EXPENDITURE", "INSTRUCTION_EXPENDITURE",
"SUPPORT_SERVICES_EXPENDITURE", "AVG_READING_4_SCORE", "AVG_READING_8_SCORE",
"AVG_MATH_4_SCORE", "AVG_MATH_8_SCORE"];

var expressed = attrArray[2];

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

      setGraticule(map, path);

      //translate us topojson
      var usa = topojson.feature(usa, usa.objects.US_states).features;

      //create the color scale
      var colorScale = makeColorScale(csvData);

      //join data
      stateData = joinData(usa, csvData);

      //function to create enumeration units
      setEnumerationUnits(usa, map, path, colorScale);
    };
  };// end of setMap function

  function setGraticule(map, path){
    //create graticule generator
    var graticule = d3.geo.graticule()
        .step([5,5]); //lines every 5 degrees

    //create graticule background
    var gratBackground = map.append("path")
        .datum(graticule.outline())
        .attr("class", "gratBackground")
        .attr("d", path);

    var gratLines = map.selectAll(".gratLines")
        .data(graticule.lines())
        .enter()
        .append("path")
        .attr("class", "gratLines")
        .attr("d", path);
  }; // end of setGraticule

  function joinData(usa, csvData){
    //loop through csv to assign each set of values to geojson region
    for (var i=0; i<csvData.length; i++){
      var csvState = csvData[i]; //assign csv row to variable
      var csvKey = csvState.GEOID; //the primary key for states

      //loop through geojson states  to find correct state
      for (var a=0; a<usa.length;a++){
        var geojsonProps = usa[a].properties; //the properties for current state in geojson
        var geojsonKey = geojsonProps.GEOID;
        //console.log(geojsonKey);

        //when keys match, transfer csv data to geojson properties objects
        if (geojsonKey==csvKey){
          //assign all attributes and values
          attrArray.forEach(function(attr){
            var val = parseFloat(csvState[attr]); //get csv attribute value
            geojsonProps[attr] = val; //add that value to the geojson properties
          });
        //console.log(geojsonProps);
        };
      };
    };
   console.log(usa);
   return usa;
 };// end of joinData

 function setEnumerationUnits(usa, map, path, colorScale){

         //add US states to map
         var states = map.selectAll(".states")
             .data(usa)
             .enter()
             .append("path")
             .attr("class", function(d){
               return "states " + d.properties.GEOID;
             })
             .attr("d", path)
             .style("fill", function(d){
               return choropleth(d.properties, colorScale);
             });
 };

 function makeColorScale(data){
   var colorClasses = [
       "#D4B9DA",
       "#C994C7",
       "#DF65B0",
       "#DD1C77",
       "#980043"
   ];

   //create color scale generator
   var colorScale = d3.scale.threshold()
      .range(colorClasses);

  //build array of all values of the expressed attribute
  var domainArray = [];
  for (var i=0; i<data.length; i++){
    var val = parseFloat(data[i][expressed]);
    domainArray.push(val);
  };

  //cluster data using ckmeans clustering algorithm to create natural breaks
  var clusters = ss.ckmeans(domainArray, 5);
  console.log(clusters);

  //reset domain array to cluster minimums
  domainArray = clusters.map(function(d){
    return d3.min(d);
  });
  //remove first value from domain array to create class break points
  domainArray.shift();

  //assign array of expressed values as scale domain
  colorScale.domain(domainArray);

  return colorScale;
};

function choropleth(props, colorScale){
  //make sure attribute value is a number
  var val = parseFloat(props[expressed]);
  //if attribute value exists, assign a color, otherwise assign gray
  if (typeof val == 'number' && !isNaN(val)){
    return colorScale(val);
  } else {
    return "#CCC";
  };
};
})();
