d3.csv("data/final_metadata.csv").then(data => {

    // First reduce the size of the data to a feasible number (200)
    // TODO: implement a better MDS algorithm in order to include all the data
    var dataset_size = Math.min(data.length, 200) 
    data = data.slice(0, dataset_size)

    sliderIdToAttr = {'div#slider-range':'no_of_rows', 
    'div#cat-col-range':'no_of_string_columns',
    'div#num-col-range':'no_of_numerical_columns',
    'div#uniq-cat-range':'percent_unique_values_string',
    'div#null-cat-range':'percent_null_values_string',
    'div#uniq-num-range':'percent_unique_values_numeric', 
    'div#null-num-range':'percent_null_values_numeric'}

    const numRows = d => d => parseInt(d.no_of_rows);
    const numCatCols = d => d => parseInt(d.no_of_string_columns);
    const numNumCols = d => d => parseInt(d.no_of_numerical_columns);
    const percCatUniq = d => d => parseFloat(d.percent_unique_values_string);
    const percCatNull = d => d => parseFloat(d.percent_null_values_string);
    const percNumUniq = d => d => parseFloat(d.percent_unique_values_numeric);
    const percNumNull = d => d => parseFloat(d.percent_null_values_numeric);

    //save current ranges of all sliders
    sliderValues = Object()

    reset_btn = d3.select('#reset-filters-btn')
    reset_btn.on('click', resetFilters)

    createAllSliders()

    function createAllSliders() {
        create_filter_slider('div#slider-range', numRows);
        create_filter_slider('div#cat-col-range', numCatCols);
        create_filter_slider('div#num-col-range', numNumCols);
        create_filter_slider('div#uniq-cat-range', percCatUniq);
        create_filter_slider('div#null-cat-range', percCatNull);
        create_filter_slider('div#uniq-num-range', percNumUniq);
        create_filter_slider('div#null-num-range', percNumNull);
    }

    function create_filter_slider(selector, attribute) {

        //empty previous content of selection div
        d3.select(selector).html("")

        var cat_col_range = d3.sliderBottom()
                            .min(d3.min(data, attribute(data)))
                            .max(d3.max(data, attribute(data)))
                            .width(200)
                            .step(1)
                            .ticks(5)
                            .default([d3.min(data, attribute(data)), d3.max(data, attribute(data))])
                            .fill('#2196f3')
                            .on('onchange', val => {
                                sliderValues[selector] = val
                                d3.selectAll('#filters').dispatch('data_filtered', {detail: {new_data:filter_data()}});
                            })
        sliderValues[selector] = [(d3.min(data, attribute(data))), (d3.max(data, attribute(data)))]


        var gRange = d3.select(selector)
                        .append('svg')
                        .attr('width', 250)
                        .attr('height', 100)
                        .append('g')
                        .attr('transform', 'translate(30,30)');

        gRange.call(cat_col_range);
    }
    //filter data based on current settings of sliders
    function filter_data(){
        //console.log(sliderValues)
        new_data = []
        for(i =0; i < dataset_size; i++){
            filtered_out = false;
            for(let slider in sliderValues){
                min = parseFloat(sliderValues[slider][0])
                max = parseFloat(sliderValues[slider][1])
                attr = sliderIdToAttr[slider]
                val = parseFloat(data[i][attr])
                //console.log(val, min, max)
                if(val < min || val>max){
                    //remove from screen if dataset doesnt meet any filter range
                    filtered_out = true
                }
            }
            if (!filtered_out) {
                new_data.push(data[i])
            }
        }
        return new_data
    }
    function resetFilters(){

        //recreate sliders to give them their original values
        createAllSliders()
        d3.selectAll('#filters').dispatch('data_filtered', {detail: {new_data:filter_data()}});
    }

});