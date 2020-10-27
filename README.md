# Loch Prospector: Metadata Visualization for Lakes of Open Data

Link to the visualization: https://lochprospector.github.io/

## Instructions

The project can be seen live at the link provided on top.

For local use, the instructions for set up can be followed.

## Setup

1. Clone this repository to your local machine.
  
    E.g., in your terminal / command prompt `CD` to where you want this the folder for this activity to be. Then run `https://github.com/lochprospector/lochprospector.github.io.git`

1. `CD` or open a terminal / command prompt window into the cloned folder.

1. Start a simple python webserver. E.g., `python -m http.server`, `python3 -m http.server`, or `py -m http.server`. If you are using python 2 you will need to use `python -m SimpleHTTPServer` instead, but please switch to python 3 as [Python 2 was sunset on 2020.01.01](https://www.python.org/doc/sunset-python-2/).

1. Wait for the output: `Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/)`

1. Now open your web browser (Firefox or Chrome) and navigate to the URL: http://localhost:8000

### Data Preprocessing

To download the data on your local machine:

```
pip install -r data/requirements.txt
python data/download_data.py
```

The whole process of downloading and preprocessing would likely take a couple of hours (longer depending on the machine) as it downloads all the CSV files and computes the values for the metadata.

## Organization

### Root Files

* `README.md` is this explanatory file for the repo.

* `index.html` contains the main website content.

* `style.css` contains the CSS.

* `LICENCE` is the source code license for the template.

### Folders

* `data` contains data files as well as data scraping and pre-processing code.

* `favicons` contains the favicons for the web page

* `js` contains all JavaScript files written.

  * `visualization.js` is the main code that builds all visualizations. Each visualization is built following the [Reusable Chart model](https://bost.ocks.org/mike/chart/), with a separate .js file for each one.

  * `scatterplot.js` contains the code for displaying the data points.

  * `mds.js` computes the multidimensional scaling for the default or given weights and returns the coordinates for each data point.

  * `filters.js` displays six filters for the attributes and changes the number of data sets to reflect the changed values.

  * `histogram.js` provides the bar charts visualizing the distribution of four attributes.

* `lib` contains JavaScript libraries used. It currently includes D3.

## IEEE Vis 2020

Paper and Supplementary Materials can be found at: https://osf.io/zkxv9/

Watch a short 30s video teaser:

![](/videos/metadatavis-preview.mp4)

or a 7 minute demo video:

![](/videos/metadatavis-fullvideo.mp4)


## Authors

The authors are: [Neha Makhija](https://www.khoury.northeastern.edu/people/neha-makhija/),
      [Mansi Jain](https://www.linkedin.com/in/jmansi/),
      [Nikolaos Tziavelis](https://www.khoury.northeastern.edu/people/nikolaos-tziavelis/),
      [Laura Di Rocco](https://www.khoury.northeastern.edu/people/laura-di-rocco/),
      [Sara Di Bartolomeo](https://www.khoury.northeastern.edu/people/sara-di-bartolomeo/),
      [Cody Dunne](https://cody.khoury.northeastern.edu/).