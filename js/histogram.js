/* global D3 */

// Initialize a histogram. Modeled after Mike Bostock's
// Reusable Chart framework https://bost.ocks.org/mike/chart/
function histogram() {

	// set the dimensions and margins of the graph
	let margin = {
		top: 10,
		left: 45,
		right: 20,
		bottom: 30
	  },
	width = 400 - margin.left - margin.right,
	height = 250 - margin.top - margin.bottom,
	attribute = null,
	selector = null,
	hoverableElements = d3.select(null),
	dispatcher,
	xAxisLabel,
	bins;

	// Create the chart by adding an svg to the div with the id 
	// specified by the selector using the given data
	function chart(data) {
		
		// Select the appropriate div
		var svg = d3.select(selector)
		// Delete any previous elements
		svg.selectAll("*").remove();

		svg = svg.append("svg")
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom)
			.append("g")
			.attr("transform",
				"translate(" + margin.left + "," + margin.top + ")");

		// X axis: scale and draw:
		var x = d3.scaleLinear()
			.domain([d3.min(data, attribute), d3.max(data, attribute)])
			.range([0, width]);
		svg.append("g")
			.attr("transform", "translate(0," + height + ")")
			.call(d3.axisBottom(x));

		// Set the parameters for the histogram
		var histogram = d3.histogram()
			.value(attribute)   // I need to give the vector of value
			.domain(x.domain())  // then the domain of the graphic
			.thresholds(10);	//if we pass a single number to the thresholds function, then we get approximately that many bins

		// And apply this function to data to get the bins
		bins = histogram(data);
		//console.log(bins)

		// Y axis: scale and draw:
		var y = d3.scaleLinear()
			.range([height, 0]);
		y.domain([0, d3.max(bins, function(d) { return d.length; })]);   // d3.hist has to be called before the Y axis
		svg.append("g")
			.call(d3.axisLeft(y));


		//Creating tooltip element for hover text
	    var tooltip = d3.select("body")
	       .append("div")
	       .append("p")
	   	  .style("position", "absolute")
	      .style("background-color","white")
	      .style("padding","2px")
	   	  .style("z-index", "10")
	   	  .style("visibility", "hidden")
	   	  .text("a simple tooltip");

		// Append the bar rectangles to the svg element
		// If all the data have been filtered out, just return
		if( data.length != 0){
			svg.selectAll("rect")
			.data(bins)
			.enter()
			.append("rect")
				.attr("x", d => x(d.x0) + 1)
				.attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 1))
				.attr("y", d => y(d.length))
				.attr("height", d => y(0) - y(d.length))
				.attr("class", "barmark")

			// Label for X Axis
			svg.append("text")             
				.attr("transform", "translate(" + (width/2) + " ," + (height + margin.top + 20) + ")")
				.style("text-anchor", "middle")
				.style("font-size", "15px")
				.text(xAxisLabel);

			// Label for Y Axis
			svg.append("text")
				.attr("transform", "rotate(-90)")
				.attr("y", 0 - margin.left)
				.attr("x",0 - (height / 2))
				.attr("dy", "1em")
				.style("text-anchor", "middle")
				.style("font-size", "15px")
				.text("Count"); 

			hoverableElements = svg.selectAll("rect");

			// Get the name of our dispatcher's event
			let dispatchString = Object.getOwnPropertyNames(dispatcher._)[0];

			// When we hover over a bar, make it a member of the hover class so that it is highlighted
			hoverableElements
	      	.on("mousemove", function(d, i, elements){
	        	d3.select(elements[i]).classed("hover", true);
	        	// Let other charts know about our hover
	          	dispatcher.call(dispatchString, this, svg.selectAll(".hover").data());

	          	// Also show the tooltip
	      	    tooltip.html(xAxisLabel + ": " + d.x0 + "-" + d.x1 + "<br>" + "Count: " + d.length); 
		       	tooltip.style("top", (event.pageY-10)+"px").style("left",(event.pageX-120)+"px");
		        tooltip.style("visibility", "visible");
				return;
	      	})
	      	.on("mouseout", function(d, i, elements){
	      		// Stop the highlighting
	      		d3.select(elements[i]).classed("hover", false);
	      		// Let other charts know that the user stopped hovering
	        	dispatcher.call(dispatchString, this, svg.selectAll(".hover").data());

	        	// Hide the tooltip
	        	return tooltip.style("visibility", "hidden");
	      	});
		}
		//Scale height of visuals div after plot has been rendered
		a = Math.max(parseInt(d3.select('#dist-summary').style('height')),parseInt(d3.select('#vis-svg-1').style('height')),parseInt(d3.select('#filters').style('height')), parseInt(d3.select('#visuals').style('height')))
		d3.select('#visuals').style('height',a+'px')
		
		return chart;
	}

	// Setters and getters

	chart.attribute = function (_) {
		if (!arguments.length) return attribute;
		attribute = _;
		return chart;
	};

	chart.selector = function (_) {
		if (!arguments.length) return selector;
		selector = _;
		return chart;
	};

    // Gets or sets the dispatcher we use for selection events
    chart.hoverDispatcher = function (_) {
		if (!arguments.length) return dispatcher;
		dispatcher = _;
		return chart;
	};
	
	// Axis Labels
	chart.xAxisLabel = function (_) {
		if (!arguments.length) return dispatcher;
		xAxisLabel = _;
		return chart;
	}

    // Given hovered data from another visualization 
    // highlight them as hovered here (linking)
    chart.updateHover = function (hoveredData) {

		if (!arguments.length) return;

		//console.log(hoveredData)
		//console.log(hoverableElements)

		let hovered_serial_number = hoveredData.map(d => d["sr_no"])[0];
		//console.log(hovered_serial_number)

		let bin_idx = -1;
		// Find the index of the bin that this serial number belongs to
		for (var i = 0; i < bins.length; i++) 
		{
			//console.log(i)
			//console.log(bins[i])
			for (var j = 0; j < bins[i].length; j++)
			{
				//console.log(j)
				//console.log(bins[i][j])
				if (bins[i][j]["sr_no"] === hovered_serial_number)
				{
					//console.log("Found the bin!! Its index is " + i)
					bin_idx = i;
				}
			}
		}

		//console.log(bin_idx)
		//console.log(hoverableElements)
		hoverableElements.classed("hover", function(d, i)
			{
        		return i === bin_idx;         
			}
      	);
      	
    };

	return chart;
};
