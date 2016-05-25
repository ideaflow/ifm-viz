
//CONSTANTS for Timeline Window Size

var sideMargin = 40;
var bottomMargin = 30;
var bandMargin = 20;
var topMargin = bottomMargin;
var height = 180;
var width = 800;

var isFocused = false;

var timelineWindow;
var stage;
var colorBands;
var eventLines;
var eventLabels;

var stopWindowDragCallback;
var clickBandCallback;

var leftStretcher;
var rightStretcher;

var timelineData;

var indexedTimeEntries;
var indexedEvents;
var indexedBands;

function renderTimeline() {
    $.ajax({
        type: 'GET',
        crossDomain : true,
        url: 'http://localhost:8080/stubtimeline/task/trial',
        success: drawTimeline,
        error: handleError
    });
}

function handleError(err) {
    console.log("AJAX error in request: " + JSON.stringify(err, null, 2));
}

function drawTimeline(timelineData) {

    stage = new Kinetic.Stage({
        container: 'timelineHolder',
        width: width,
        height: height
    });

    var firstSegment = timelineData.timelineSegments[0];
    var secondsPerUnit = getSecondsPerUnit(firstSegment);

    drawUngroupedTimebands(stage, firstSegment, secondsPerUnit);
    drawGroupedTimebands(stage, firstSegment, secondsPerUnit);

    drawMainTimeline(stage, formatShort(0), formatShort(getEndOfTimeline(firstSegment)));

    //drawTimebandsLayer(stage, data.timeBands, secondsPerUnit);
    //drawMainTimeline(stage, data);
    //drawEventsLayer(stage, data.events, secondsPerUnit);
    //drawWindow(stage);
    //drawStretchControls(stage);
    //initIdIndexedTimelineData(timelineData);
}


function drawUngroupedTimebands(stage, firstSegment, secondsPerUnit) {
    var layer = new Kinetic.Layer();

    firstSegment.ideaFlowBands.forEach(function(band) {
        if (band.type != "PROGRESS") {

            var colorBand = drawBand(layer, band, secondsPerUnit);
            var bandInfo = { data: band, rect: colorBand };

            colorBand.on('mouseover touchstart', function() { highlightBand(bandInfo) });
            colorBand.on('mouseout touchend', function() { restoreBand(bandInfo) });
        }
    });

    stage.add(layer);
}

function drawGroupedTimebands(stage, firstSegment, secondsPerUnit) {
    firstSegment.timeBandGroups.forEach(function(group) {
        var groupLayer = new Kinetic.Layer();

        var groupInfo = { bandInfos: [], layer: groupLayer };

        group.linkedTimeBands.forEach(function(band) {
            if (band.type != "PROGRESS") {
                var colorBand = drawBand(groupLayer, band, secondsPerUnit);
                var bandInfo = { data: band, rect: colorBand };
                groupInfo.bandInfos.push(bandInfo);
            }
        });

        groupLayer.on('mouseover touchstart', function() { highlightBandGroup(groupInfo) });
        groupLayer.on('mouseout touchend', function() { restoreBandGroup(groupInfo) });

        stage.add(groupLayer);
    });
}



function highlightBand(bandInfo) {
    bandInfo.rect.setFill(lookupBandColors(bandInfo.data.type)[1]);
    bandInfo.rect.getLayer().draw();
}

function restoreBand(bandInfo) {
    bandInfo.rect.setFill(lookupBandColors(bandInfo.data.type)[0]);
    bandInfo.rect.getLayer().draw();
}

function highlightBandGroup(groupInfo) {
    groupInfo.bandInfos.forEach(function(bandInfo) {
        bandInfo.rect.setFill(lookupBandColors(bandInfo.data.type)[1])
    });
    groupInfo.layer.draw();

}

function restoreBandGroup(groupInfo) {
    groupInfo.bandInfos.forEach(function(bandInfo) {
        bandInfo.rect.setFill(lookupBandColors(bandInfo.data.type)[0])
    });
    groupInfo.layer.draw();
}

function drawBand(layer, band, secondsPerUnit) {
    var offset = Math.round(band.relativeStart / secondsPerUnit) + sideMargin;
    var size = Math.round(band.duration / secondsPerUnit);

    var colorBand = new Kinetic.Rect({
        x: offset,
        y: topMargin + bandMargin,
        width: size,
        height: height - bottomMargin - topMargin - bandMargin,
        fill: lookupBandColors(band.type)[0],
        stroke: lookupBandColors(band.type)[1],
        strokeWidth: 1
    });

    layer.add(colorBand);
    return colorBand;
}






function lookupBandColors(bandType) {
    if (bandType == 'CONFLICT') {
        return ['#ff0078', '#FF90D1', '#FFDEF6']
    } else if (bandType == 'LEARNING') {
        return ['#520ce8', '#9694E8', '#EDE2FD']
    } else if (bandType == 'REWORK') {
        return ['#ffcb01', '#FFEA7C', '#FFF5A7']
    } else {
        throw "Unable to find color for bandType: "+bandType
    }
}

function formatShort(duration) {
    var d = Number(duration);
    var h = Math.floor(d / 3600);
    var m = Math.floor(d % 3600 / 60);
    return ( h + ":" + (m < 10 ? "0" : "") + m);
}

function getEndOfTimeline(segment) {
    return segment.relativeStart + segment.duration;
}

function getSecondsPerUnit(segment) {
    return (getEndOfTimeline(segment) / (width - (2 * sideMargin)));
}


function drawMainTimeline(stage, startTick, endTick) {
    var layer = new Kinetic.Layer();
    var tickHeight = 10;
    var tickMargin = 5;
    var startTickLabel = new Kinetic.Text({
        x: sideMargin - tickMargin,
        y: height - bottomMargin,
        text: startTick,
        fontSize: 13,
        align: 'right',
        fontFamily: 'Calibri',
        fill: 'black'
    });
    startTickLabel.setOffset({x: startTickLabel.getWidth()});

    var endTickLabel = new Kinetic.Text({
        x: width - sideMargin + tickMargin,
        y: height - bottomMargin,
        text: endTick,
        fontSize: 13,
        fontFamily: 'Calibri',
        fill: 'black'
    });

    layer.add(createMainLine(tickHeight));
    layer.add(startTickLabel);
    layer.add(endTickLabel);
    stage.add(layer);
}

function createMainLine(tickHeight) {
    return new Kinetic.Line({
        points: [
            [sideMargin, height - bottomMargin + tickHeight],
            [sideMargin, height - bottomMargin],
            [width - sideMargin, height - bottomMargin],
            [width - sideMargin, height - bottomMargin + tickHeight]
        ],
        stroke: 'black',
        strokeWidth: 3,
        lineCap: 'square',
        lineJoin: 'round'
    });
}


//############ OLD STUFF #############




function refreshTimeline() {
    $.ajax({
        type: 'GET',
        url: '/visualizer/timeline/showTimeline',
        success: drawTimeline,
        error: handleError
    });
}

function showTimelineWindow(flag) {
    if (timelineWindow) {
        timelineWindow.setVisible(flag);
        stage.draw();
    }
}

function registerStopWindowDragCallback(callback) {
    stopWindowDragCallback = callback;
}

function registerClickBandCallback(callback) {
    clickBandCallback = callback;
}

function getTimelineWindowOffset() {
    var position =(timelineWindow.getPosition().x - sideMargin);
    return position * (timelineData.end.offset / (width - (2 * sideMargin)));

}

function scrollToTimePosition() {
    var element = document.getElementById('timeline_scrollwindow');

    var offset = getTimelineWindowOffset();
    var closestActivity;

    $("td.hiddenOffset").each(
            function( index ) {
                if (offset >= $( this ).text()) {
                    closestActivity = index;
                }
            }
    );

    $("#timeline_scrollwindow").scrollTo("#detail_"+closestActivity, 500);
}

function updateTimelineWindowPosition() {
    var scrollTop = $("#timeline_scrollwindow").scrollTop();
    var closestOffset;

    $("td.hiddenOffset").each(
            function( index ) {
                var isVisible = isElementVisibleInContainer("#detail_"+index, "#timeline_scrollwindow");
                if (isVisible) {
                    closestOffset = $(this).text()
                }
            }
    );
    if (!closestOffset) {
        closestOffset = 0;
    }

    var newPosition = (closestOffset / getSecondsPerUnit()) + sideMargin;
    if (newPosition > (width - timelineWindow.getWidth()) - sideMargin) {
        newPosition  = (width - timelineWindow.getWidth()) - sideMargin;
    }

    console.log("New position: offset="+closestOffset+", pixelPosition="+ newPosition);
    timelineWindow.setPosition(newPosition, timelineWindow.getPosition().y);
    showTimelineWindow(true);
}

function isElementVisibleInContainer(elementSelector, containerSelector) {
    var isVisible = false;
    var containerViewTop = $(containerSelector).offset().top;

    if ($(elementSelector).offset()) {
        var elementTop = $(elementSelector).offset().top;
        isVisible = elementTop < containerViewTop;
    }

    return isVisible
}


function initIdIndexedTimelineData(data) {
    indexedTimeEntries = new Array();

    for (var i = 0; i < data.timeBands.length; i++) {
        indexedTimeEntries[data.timeBands[i].id] = data.timeBands[i];
    }
    for (i = 0; i < data.events.length; i++) {
        indexedTimeEntries[data.events[i].id] = data.events[i];
    }
}

function drawWindow(stage) {
    var windowScale = 5;
    var strokeWidth = 3;
    var windowWidth = (width - (sideMargin * 2)) / 5;
    var layer = new Kinetic.Layer();
    timelineWindow = new Kinetic.Rect({
        x: sideMargin,
        y: topMargin + bandMargin - windowScale,
        width: windowWidth,
        height: height - bottomMargin - topMargin - bandMargin + windowScale*2,
        fill: "rgba(255,255,200, .1)",
        stroke: "rgba(30,255,30, 1)",
        strokeWidth: strokeWidth,
        draggable: true,
        visible: false,
        dragBoundFunc: function(pos) {
            var newX = pos.x;
            var newY = pos.y;
            if (newX < sideMargin) {
                newX = sideMargin;
            } else if (newX > (width - windowWidth - sideMargin)) {
                newX = (width - windowWidth - sideMargin);
            }
            return {
                x: newX,
                y: this.getAbsolutePosition().y
            }
        }
    });

    timelineWindow.on('mouseover touchstart', function () {
        this.setFill("rgba(255,255,0, .1)");
        document.body.style.cursor = 'move';
        layer.draw();
    });

    timelineWindow.on('mouseout touchend', function () {
        this.setFill("rgba(255,255,200, .1)");
        document.body.style.cursor = 'default';
        layer.draw();
    });

    timelineWindow.on('dragend', stopWindowDragCallback);

    layer.add(timelineWindow);
    stage.add(layer);
}

function drawStretchControls(stage) {
    var layer = new Kinetic.Layer();
    leftStretcher = createStretcher(sideMargin);
    leftStretcher.on('dragmove', function () {
        if (isFocused) {
            focusBand.setWidth(focusBand.getWidth() + focusBand.getX() - leftStretcher.getX());
            focusBand.setX(leftStretcher.getX());
            stage.draw();
        }
    });

    rightStretcher = createStretcher(width - sideMargin);
    rightStretcher.on('dragmove', function () {
        if (isFocused) {
            focusBand.setWidth(rightStretcher.getX() - focusBand.getX());
            stage.draw();
        }
    });

    layer.add(leftStretcher);
    layer.add(rightStretcher);
    stage.add(layer);
}

function createStretcher(xPosition) {
    var size = 10;
    var stretcher = new Kinetic.RegularPolygon({
        x: xPosition,
        y: height - bottomMargin + size+1,
        sides: 3,
        radius: size,
        fill: 'gray',
        stroke: 'black',
        strokeWidth: 1,
        visible: false,
        draggable: true,
        dragBoundFunc: function(pos) {
            var newX = pos.x;
            var newY = pos.y;
            if (newX < sideMargin) {
                newX = sideMargin;
            } else if (newX > (width - sideMargin)) {
                newX = (width - sideMargin);
            }
            return {
                x: newX,
                y: this.getAbsolutePosition().y
            }
        }
    });
    stretcher.on('mouseover touchstart', function () {
        document.body.style.cursor = 'ew-resize';
    });
    stretcher.on('mouseout touchend', function () {
        document.body.style.cursor = 'default';
    });

    return stretcher;
}


function drawEventsLayer(stage, events, secondsPerUnit) {
    var layer = new Kinetic.Layer();
    eventLines = new Array();
    eventLabels = new Array();

    indexedEvents = new Array();

    for (var i = 0; i < events.length; i++) {
        var eventParts = drawEvent(layer, events[i], secondsPerUnit);
        eventLines[i] = eventParts[0];
        eventLabels[i] = eventParts[1];

        indexedEvents[events[i].id] = eventParts;
    }
    stage.add(layer);
}
function drawEvent(layer, event, secondsPerUnit) {
    var offset = Math.round(event.offset / secondsPerUnit) + sideMargin;
    var tickHeight = 15;
    var tickMargin = 3;

    var eventLine = new Kinetic.Line({
        points: [
            [offset, topMargin],
            [offset, height - bottomMargin + tickHeight]
        ],
        stroke: 'gray',
        strokeWidth: 2,
        lineCap: 'square'
    });

    var tickLabel = new Kinetic.Text({
        x: offset,
        y: height - tickHeight + tickMargin,
        text: event.shortTime,
        align: 'center',
        fontSize: 13,
        fontFamily: 'Calibri',
        fill: 'black'
    });
    tickLabel.setOffset({x: tickLabel.getWidth() / 2});

    layer.add(eventLine);
    layer.add(tickLabel);

    return [eventLine, tickLabel];
}

function drawTimebandsLayer(stage, bands, secondsPerUnit) {
    var layer = new Kinetic.Layer();
    colorBands = new Array();
    conflictBands = new Array();
    indexedBands = new Array();
    for (var i = 0; i < bands.length; i++) {
        var colorBand = drawTimeband(layer, bands[i], secondsPerUnit);
        colorBands[i] = colorBand;
        indexedBands[bands[i].id]  = colorBand;
        if (bands[i].bandType == 'conflict') {
            conflictBands[bands[i].id] = colorBand;
        }
    }
    stage.add(layer);
}

function drawTimeband(layer, band, secondsPerUnit) {
    var offset = Math.round(band.offset / secondsPerUnit) + sideMargin;
    var size = Math.round(band.duration / secondsPerUnit);

    var colorBand = new Kinetic.Rect({
        x: offset,
        y: topMargin + bandMargin,
        width: size,
        height: height - bottomMargin - topMargin - bandMargin,
        fill: lookupBandColors(band.bandType)[0],
        stroke: lookupBandColors(band.bandType)[1],
        strokeWidth: 1
    });

    colorBand.on('mouseover touchstart', function () {
        if (!isFocused) {
            this.setFill(lookupBandColors(band.bandType)[1]);
            layer.draw();
        }
    });

    colorBand.on('mouseout touchend', function () {
        if (!isFocused) {
            this.setFill(lookupBandColors(band.bandType)[0]);
            layer.draw();
        }
    });

    colorBand.on('click', function () {
        isFocused = true;
        focusColorBand(this);
        stage.draw();
        if (clickBandCallback) {
            clickBandCallback();
        }
    });

    layer.add(colorBand);
    return colorBand;
}



function resetColorBands() {
    isFocused = false;

    for (var i = 0; i < colorBands.length; i++) {
        colorBands[i].setOpacity('1');
        var color = lookupBandColors(timelineData.timeBands[i].bandType)[0];
        colorBands[i].setFill(color);
    }
    leftStretcher.hide();
    rightStretcher.hide();
    stage.draw();

}

function focusColorBand(band) {
    focusBand = band;
    for (var i = 0; i < colorBands.length; i++) {
        colorBands[i].setOpacity('.4');
    }
    focusBand.setOpacity('1');
    leftStretcher.setX(focusBand.getX());
    rightStretcher.setX(focusBand.getX() + focusBand.getWidth());

    leftStretcher.show();
    rightStretcher.show();
}

function highlightColorBand(index) {
    //colorBands[index].setOpacity('.6');
    colorBands[index].setFill(lookupBandColors(timelineData.timeBands[index].bandType)[1]);
    stage.draw();
}

function highlightEventById(id) {
    var eventData = indexedTimeEntries[id];
    var event = indexedEvents[id];

    event[0].setStroke('#d3e0ff');
    event[1].setFill('#79a1ff');
    stage.draw();
}

function highlightColorBandById(id) {
    var colorBandData = indexedTimeEntries[id];
    var colorBand = indexedBands[id];

    colorBand.setFill(lookupBandColors(colorBandData.bandType)[1]);
    stage.draw();

}

function highlightConflict(id) {
    for (var i = 0; i < colorBands.length; i++) {
        if (colorBands[i] == conflictBands[id]) {
            colorBands[i].setFill(lookupBandColors(timelineData.timeBands[i].bandType)[1]);
        }
    }
//    conflictBands[id].setOpacity('.6');
    stage.draw();
}

function highlightEvent(index) {
    eventLines[index].setStroke('#d3e0ff');
    eventLabels[index].setFill('#79a1ff');
    stage.draw();
}

function resetEventLines() {
    for (var i = 0; i < eventLines.length; i++) {
        eventLines[i].setStroke('gray');
        eventLabels[i].setFill('black');
    }
    stage.draw();
}

function drawPies() {
    $("span.pie").peity("pie", {
        fill: [lookupBandColors('conflict')[0], '#CCCCCC'],
        diameter: 20
    });
}

function drawHighlightPies() {
    $("span.conflictpie").peity("pie", {
        fill: [lookupBandColors('conflict')[0], lookupBandColors('conflict')[2]],
        diameter: 20
    });
    $("span.reworkpie").peity("pie", {
        fill: [lookupBandColors('rework')[0], lookupBandColors('rework')[2]],
        diameter: 20
    });
    $("span.learningpie").peity("pie", {
        fill: [lookupBandColors('learning')[0], lookupBandColors('learning')[2]],
        diameter: 20
    });
}
