/*
 * Copyright 2015 New Iron Group, Inc.
 *
 * Licensed under the GNU GENERAL PUBLIC LICENSE, Version 3 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * 	http://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var animate;
var conflict_color = "#ff0078";
var learning_color = "#520ce8";
var rework_color = "#ffcb01";

function renderCharts() {
    renderDefaultCharts();
}

function renderDefaultCharts() {
    renderFilteredCharts(null, null);
}

function renderFilteredCharts(author, hashtag) {
    var baseUrl = '/chart';
    var queryParams =  toQueryParams(author, hashtag);
    var title = refreshTitle(author, hashtag);
    var url =
    $.ajax({
        type: 'GET',
        url: baseUrl + "/frequency" + queryParams,
        success: drawFrequencyCharts,
        error: handleError
    });

    $.ajax({
        type: 'GET',
        url: baseUrl + "/series" + queryParams,
        success: drawSeriesCharts,
        error: handleError
    });
}

function drawFrequencyCharts(chartData) {
    var plot1 = drawBarChart('frequencyConflict', chartData.conflictSeriesLabel, chartData.ticks, chartData.conflictSeries, conflict_color);
    var plot2 = drawBarChart('frequencyLearning', chartData.learningSeriesLabel, chartData.ticks, chartData.learningSeries, learning_color);
    var plot3 = drawBarChart('frequencyRework', chartData.reworkSeriesLabel, chartData.ticks, chartData.reworkSeries, rework_color);
    normalizeYAxis([plot1, plot2, plot3]);
}

function drawSeriesCharts(chartData) {
    drawLineChart('seriesConflict', chartData.conflictSeriesLabel, chartData.conflictSeries, conflict_color);
    drawLineChart('seriesLearning', chartData.learningSeriesLabel, chartData.learningSeries, learning_color);
    drawLineChart('seriesRework', chartData.reworkSeriesLabel, chartData.reworkSeries, rework_color);
}

function normalizeYAxis(plots) {
    var max = 0;
    var interval = 0;
    var numTicks = 0;
    for (var i = 0; i < plots.length; i++) {
        if (plots[i].axes.yaxis.max > max) {
            max = plots[i].axes.yaxis.max;
            interval = plots[i].axes.yaxis.tickInterval;
            numTicks = plots[i].axes.yaxis.numberTicks;
        }
    }
    for (i = 0; i < plots.length; i++) {
        plots[i].axes.yaxis.max = max;
        plots[i].axes.yaxis.tickInterval = interval;
        plots[i].axes.yaxis.numberTicks = numTicks;
        plots[i].replot();
    }
}


function toQueryParams(author, hashtag) {
    var queryParams = "";
    if (author || hashtag) queryParams += '?';
    if (author) {
        queryParams += 'author=' +author.toLowerCase();
    }

    if (author && hashtag) queryParams += '&';
    if (hashtag) {
        queryParams += 'hashtag=' +hashtag.toLowerCase();
    }

    return queryParams
}

function refreshTitle(author, hashtag) {
    var title = "";
    if (!author && !hashtag) {
        title = "All Data (no filters)"
    }
    if (author) {
        title = "Author: "+author;
    }
    if (hashtag) {
        title = "Filtered By: #"+hashtag;
    }
    $( "#dashboardTitle" ).html("<h1>"+title+"</h1>");
}

function handleError(e) {
    alert(e.status + " : " +e.statusText)
}


function drawBarChart(chartDiv, title, ticks, series, color) {
    $( '#'+chartDiv).html('');
    $.jqplot.config.enablePlugins = true;

    var plot = $.jqplot(chartDiv, [series], {
        title: title,
        animate:false,
        seriesColors:[color],
        seriesDefaults:{
            renderer:$.jqplot.BarRenderer,
            pointLabels: { show: false }
        },
        axes: {
            xaxis: {
                renderer: $.jqplot.CategoryAxisRenderer,
                ticks: ticks
            }
        },
        highlighter: { show: false }
    });
    return plot;

}

function drawLineChart(chartDiv, title, data, color) {
    var visible = resetDiv(chartDiv, data);
    if (!visible) return;

    var plot = $.jqplot (chartDiv, [data], {
        title: title,
        animate: true,
        seriesDefaults: {
                    rendererOptions: {
                        smooth: true
                    },
                    pointLabels: { show:false }
        },
        axes: {
            xaxis: {
                min: 1,
                max:data.length,
                tickOptions: {
                    showLabel: false,
                    showGridline: false,
                    showMark: false
                }
            },
            yaxis: {
                min: 0
            }
        },
        series:[{showMarker:false}],
        seriesColors:[color]
    });
    return plot;
}

function resetDiv(divName, data) {
    var myDiv = $( '#'+divName );
    myDiv.html('');

    var ele = document.getElementById(divName);
    var visible = data.length > 0;

    if(!visible) {
        ele.style.display = "none";
    }
    else {
        ele.style.display = "block";
    }



    return visible;

}