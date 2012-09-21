/*
 * Copyright 2012, Qualcomm Innovation Center, Inc.
 * 
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 * 
 *        http://www.apache.org/licenses/LICENSE-2.0
 * 
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */
var $ = function(id) {
    return document.getElementById(id);
};

var sources = {},
    sinks = {};

window.URL = window.URL || window.webkitURL;
var tabUseButton = $('tabUseButton'),
    tabHostButton = $('tabHostButton');

tabUseButton.onclick = function() {
    tabHostButton.className = 'disabled';
    tabHost.style.display = 'none';
    tabUseButton.className = 'enabled';
    tabUse.style.display = 'block';
    return false;
};

tabHostButton.onclick = function() {
    tabUseButton.className = 'disabled';
    tabUse.style.display = 'none';
    tabHostButton.className = 'enabled';
    tabHost.style.display = 'block';
    return false;
};

var onStart = function(guid) {
    $('guid').innerHTML = guid;
};

var onSourceChanged = function(props) {
    var li,
        button,
        span,
        i;

    while ($('useSources').hasChildNodes()) {
        $('useSources').removeChild($('useSources').firstChild);
    }

    for (i = 0; i < props.Streams.length; ++i) {
        li = document.createElement('li');
        li.className = 'use';

        button = document.createElement('button');
        button.innerHTML = '>';
        li.appendChild(button);
        
        span = document.createElement('span');
        span.innerHTML = props.Streams[i][0];
        li.appendChild(span);
        
        button.onclick = onPush(props.Streams[i]);
        
        $('useSources').appendChild(li);
    }
};

document.forms['browseSource'].sourceNames.onchange = function() {
    var name = document.forms['browseSource'].sourceNames.value;

    browser.leaveSource();
    if (name !== 'Searching...') {
        browser.joinSource(onSourceChanged, 'trm.streaming.source-' + name);
    }
};

var onSource = function(name) {
    var sourceNames = document.forms['browseSource'].sourceNames,
        sourceName = sourceNames.value,
        i,
        n,
        option;

    while (sourceNames.hasChildNodes()) {
        sourceNames.removeChild(sourceNames.firstChild);
    }
    n = 0;
    for (i in sources) {
        option = document.createElement('option');
        option.innerHTML = i.replace('trm.streaming.source-', '');
        sourceNames.appendChild(option);
        ++n;
    }
    if (n > 0) {
        sourceNames.disabled = false;
    } else {
        option = document.createElement('option');
        option.innerHTML = 'Searching...';
        sourceNames.appendChild(option);
        sourceNames.disabled = true;
    }
    if (sourceName !== sourceNames.value) {
        sourceNames.onchange();
    }
};

var onFoundSource = function(name) {
    sources[name] = {};
    onSource();
};

var onLostSource = function(name) {
    delete sources[name];
    onSource();
};

var onPush = function(stream) {
    return function() {
        var fname = stream[0],
            name = document.forms['browseSource'].sourceNames.value,
            port = stream[1],
            sink = document.forms['browseSink'].sinkNames.value;

        browser.push(fname, 'trm.streaming.source-' + name, port, 'trm.streaming.sink-' + sink);
        return false;
    };
};

var onSinkChanged = function(props) {
    var li,
        button,
        span,
        i;

    while ($('useSinks').hasChildNodes()) {
        $('useSinks').removeChild($('useSinks').firstChild);
    }

    for (i = 0; i < props.Playlist.length; ++i) {
        li = document.createElement('li');
        li.className = 'use';
        
        span = document.createElement('span');
        if (i === props.NowPlaying) {
            span.className = 'nowplaying';
        }
        span.innerHTML = props.Playlist[i];
        li.appendChild(span);
        
        $('useSinks').appendChild(li);
    }
    if (props.Playlist.length > 0) {
        $('play').disabled = false;
        $('prev').disabled = false;
        $('next').disabled = false;
    }
};

document.forms['browseSink'].sinkNames.onchange = function() {
    var name = document.forms['browseSink'].sinkNames.value;

    browser.leaveSink();
    if (name !== 'Searching...') {
        browser.joinSink(onSinkChanged, 'trm.streaming.sink-' + name);
    }
};

var onSink = function(name) {
    var sinkNames = document.forms['browseSink'].sinkNames,
        sinkName = sinkNames.value,
        i,
        n,
        option;

    while (sinkNames.hasChildNodes()) {
        sinkNames.removeChild(sinkNames.firstChild);
    }
    n = 0;
    for (i in sinks) {
        option = document.createElement('option');
        option.innerHTML = i.replace('trm.streaming.sink-', '');
        sinkNames.appendChild(option);
        ++n;
    }
    if (n > 0) {
        sinkNames.disabled = false;
    } else {
        option = document.createElement('option');
        option.innerHTML = 'Searching...';
        sinkNames.appendChild(option);
        sinkNames.disabled = true;
    }
    if (sinkName !== sinkNames.value) {
        sinkNames.onchange();
    }
};

var onFoundSink = function(name) {
    sinks[name] = {};
    onSink();
};

var onLostSink = function(name) {
    delete sinks[name];
    onSink();
};

$('play').onclick = function() {
    var sink = document.forms['browseSink'].sinkNames.value;

    if ($('play').innerHTML === '&gt;') {
        browser.play('trm.streaming.sink-' + sink);
        $('play').innerHTML = '||';
    } else {
        browser.pause('trm.streaming.sink-' + sink);
        $('play').innerHTML = '&gt;';
    }
    return false;
};

$('prev').onclick = function() {
    var sink = document.forms['browseSink'].sinkNames.value;

    browser.previous('trm.streaming.sink-' + sink);
    $('play').innerHTML = '&gt;';
    return false;
};
$('next').onclick = function() {
    var sink = document.forms['browseSink'].sinkNames.value;

    browser.next('trm.streaming.sink-' + sink);
    $('play').innerHTML = '&gt;';
    return false;
};

$('add').onclick = function() {
    $('input').click();
};

var addSource = function(file) {
    var li,
        button,
        span,
        lis;

    source.addSource(file);

    li = document.createElement('li');
    li.className = 'host';
    li.setAttribute('name', file.name);

    button = document.createElement('button');
    button.innerHTML = '-';
    li.appendChild(button);

    span = document.createElement('span');
    span.innerHTML = file.name;
    li.appendChild(span);

    button.onclick = removeSource(li);
    
    lis = $('hostSources').getElementsByTagName('li');
    $('hostSources').insertBefore(li, lis.item(lis.length - 1));
};

var removeSource = function(li) {
    return function() {
        var name = li.getAttribute('name');

        source.removeSource(name);
        $('hostSources').removeChild(li);
    };
};

$('input').onchange = function() {
    var files = this.files,
        i;

    for (i = 0; i < files.length; ++i) {
        addSource(files[i]);
    }
    document.forms["addSource"].reset();
};

/* The initial state of the page. */
tabUseButton.onclick();

navigator.requestPermission('org.alljoyn.bus', function() { 
    source.start(onStart);
    browser.start(onFoundSource, onLostSource, onFoundSink, onLostSink);
});
