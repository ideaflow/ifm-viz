
//CONSTANTS for Timeline Window Size

var sideMargin = 40;
var bottomMargin = 30;
var bandMargin = 20;
var topMargin = bottomMargin;
var height = 180;
var width = 800;


//DATA STRUCTURES TO SUPPORT HIGHLIGHT RESPONSES

var bandsById = [];
var eventsById = [];

function renderTaskInfo() {
    var param = url('#taskId');
    $.ajax({
        type: 'GET',
        crossDomain : true,
        headers: {"X-API-KEY": "ed88ceeb-b0c4-4bd1-bde1-97731ec64a17",
                  "Origin": "localhost:8080"},
        url: 'http://ifm-publisher.herokuapp.com/task/id/'+param,
        success: populateTaskInfo,
        error: handleError
    });
}

function renderTimeline() {
    var param = url('#taskId');
    $.ajax({
        type: 'GET',
        crossDomain : true,
        headers: {"X-API-KEY": "ed88ceeb-b0c4-4bd1-bde1-97731ec64a17"},
        url: 'http://ifm-publisher.herokuapp.com/ideaflow/timeline/task/'+param, //trialAndError, detail
        success: drawTimeline,
        error: handleError
    });
}

function handleError(err) {
    console.log("AJAX error in request: " + JSON.stringify(err, null, 2));
}

function populateTaskInfo(taskInfo) {
    $('#taskDate').append(formatLongTime(taskInfo.creationDate));
    $('#taskDescription').append(taskInfo.name + ' : '+taskInfo.description);
}

function formatLongTime(timeStr) {
    return moment(timeStr).format("MMMM DD YYYY, h:mm A");
}

function drawTimeline(timelineData) {

    stage = new Kinetic.Stage({
        container: 'timelineHolder',
        width: width,
        height: height
    });

    var secondsPerUnit = getSecondsPerUnit(timelineData);

    drawUngroupedTimebands(stage, timelineData, secondsPerUnit);
    drawGroupedTimebands(stage, timelineData, secondsPerUnit);
    drawMainTimeline(stage, formatShort(0), formatShort(getEndOfTimeline(timelineData)));

    drawEvents(stage, timelineData.events, secondsPerUnit);
}


function drawUngroupedTimebands(stage, timelineData, secondsPerUnit) {
    timelineData.ideaFlowBands.forEach(function(band) {
        if (band.type != "PROGRESS") {
            var groupLayer = new Kinetic.Layer();
            var bandGroup = drawBandGroup(groupLayer, band, secondsPerUnit);
            bandGroup.layer.on('mouseover touchstart', function() { highlightBandGroup(bandGroup) });
            bandGroup.layer.on('mouseout touchend', function() { restoreBandGroup(bandGroup) });
            stage.add(groupLayer);
        }
    });
}

function drawGroupedTimebands(stage, timelineData, secondsPerUnit) {
    timelineData.timeBandGroups.forEach(function(group) {
        var groupLayer = new Kinetic.Layer();
        var groupInfo = { id: group.id, bandInfos: [], layer: groupLayer };

        group.linkedTimeBands.forEach(function(band) {
            var bandGroup = drawBandGroup(groupLayer, band, secondsPerUnit);
            groupInfo.bandInfos = groupInfo.bandInfos.concat(bandGroup.bandInfos);
        });

        groupLayer.on('mouseover touchstart', function() { highlightBandGroup(groupInfo) });
        groupLayer.on('mouseout touchend', function() { restoreBandGroup(groupInfo) });
        stage.add(groupLayer);

        bandsById[group.id] = groupInfo;
    });
}


function drawBandGroup(groupLayer, band, secondsPerUnit) {
    var bandGroup = createBandGroup(groupLayer, band, secondsPerUnit);
    bandsById[bandGroup.id] = bandGroup;

    band.nestedBands.forEach(function(nestedBand) {
        var nestedBandGroup = createBandGroup(groupLayer, nestedBand, secondsPerUnit);
        bandGroup.bandInfos = bandGroup.bandInfos.concat(nestedBandGroup.bandInfos);
        bandsById[nestedBandGroup.id] = nestedBandGroup;
    });

    return bandGroup;
}

function createBandGroup(groupLayer, band, secondsPerUnit) {
    var groupInfo = { id: band.id, bandInfos: [], layer: groupLayer };

    var colorBand = drawBand(groupLayer, band, secondsPerUnit);
    var bandInfo = { data: band, rect: colorBand };

    groupInfo.bandInfos.push(bandInfo);

    return groupInfo;
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
    var offset = Math.round(band.relativePositionInSeconds / secondsPerUnit) + sideMargin;
    var size = Math.round(band.durationInSeconds / secondsPerUnit);

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

function drawEvents(stage, events, secondsPerUnit) {
    events.forEach(function(event) {
        var eventInfo = drawEventLine(stage, event, secondsPerUnit);
        eventsById[event.id] = eventInfo;

        eventInfo.layer.on('mouseover touchstart', function() { highlightEventLine(eventInfo) });
        eventInfo.layer.on('mouseout touchend', function() { restoreEventLine(eventInfo) });
    });
}

function drawEventLine(stage, event, secondsPerUnit) {
    var layer = new Kinetic.Layer();
    var offset = Math.round(event.relativePositionInSeconds / secondsPerUnit) + sideMargin;
    var tickHeight = 15;
    var tickMargin = 3;

    var strokeWidth = 2;
    if (event.eventType === 'SUBTASK') {
        strokeWidth = 4;
    }


    var eventLine = new Kinetic.Line({
        points: [
            [offset, topMargin],
            [offset, height - bottomMargin + tickHeight]
        ],
        stroke: 'gray',
        strokeWidth: strokeWidth,
        lineCap: 'square'
    });

    var tickLabel = new Kinetic.Text({
        x: offset,
        y: height - tickHeight + tickMargin,
        text: formatShort(event.relativePositionInSeconds),
        align: 'center',
        fontSize: 13,
        fontFamily: 'Calibri',
        fill: 'black'
    });
    tickLabel.setOffset({x: tickLabel.getWidth() / 2});

    layer.add(eventLine);
    layer.add(tickLabel);
    stage.add(layer);

    return {data: event, line: eventLine, tick: tickLabel, layer: layer};

}

function highlightEventLine(eventInfo) {
    eventInfo.line.setStroke('#d3e0ff');
    eventInfo.tick.setFill('#79a1ff');
    eventInfo.layer.draw();
}


function restoreEventLine(eventInfo) {
    eventInfo.line.setStroke('gray');
    eventInfo.tick.setFill('black');
    eventInfo.layer.draw();
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

function getEndOfTimeline(timelineData) {
    return timelineData.relativePositionInSeconds + timelineData.durationInSeconds;
}

function getSecondsPerUnit(timelineData) {
    return (getEndOfTimeline(timelineData) / (width - (2 * sideMargin)));
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

//RESPOND TO HIGHLIGHT REQUESTS FROM ELSEWHERE ON THE PAGE (Incoming API Calls Below)

function highlightBandById(bandId) {
    var bandToHighlight = bandsById[bandId];
    if (bandToHighlight) {
        highlightBandGroup(bandToHighlight);
    }
}

function restoreBandById(bandId) {

    var bandToRestore = bandsById[bandId];
    if (bandToRestore) {
        restoreBandGroup(bandToRestore);
    }
}

function highlightEventById(eventId) {
    var eventToHighlight = eventsById[eventId];
    if (eventToHighlight) {
        highlightEventLine(eventToHighlight);
    }
}

function restoreEventById(eventId) {

    var eventToRestore = eventsById[eventId];
    if (eventToRestore) {
        restoreEventLine(eventToRestore);
    }
}
