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
}

var sources = {},
    sinks = {},
    alljoyn = browser;

var onSource = function(name, streams) {
    var li, li2,
        ul,
        i,
        fname,
        port,
        checkbox,
        span;

    sources[name] = streams;

    li = document.createElement('li');
    li.innerHTML = name;

    ul = document.createElement('ul');
    li.appendChild(ul);

    for (i = 0; i < streams.length; ++i) {
        fname = streams[i][0];
        port = streams[i][1];

        li2 = document.createElement('li');

        checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = name;
        checkbox.value = i;
        li2.appendChild(checkbox);

        span = document.createElement('span');
        span.innerHTML = fname;
        li2.appendChild(span);

        ul.appendChild(li2);
    }

    $('sources').appendChild(li);
};

var onPush = function(sink) {
    return function() {
        var srcs = $('sources').getElementsByTagName('input'),
            i,
            fname,
            name,
            port;
    
        for (i = 0; i < srcs.length; ++i) {
            name = srcs.item(i).name;
            fname = sources[name][srcs.item(i).value][0];
            port = sources[name][srcs.item(i).value][1];
            if (srcs[i].checked) {
                browser.push(fname, name, port, sink);
                srcs[i].checked = false;
            }
        }
    };
};

var onSink = function(name, playlist) {
    var li,
        button,
        span;

    sinks[name] = playlist;

    li = document.createElement('li');

    button = document.createElement('button');
    button.innerHTML = 'Push';
    button.onclick = onPush(name);
    li.appendChild(button);
    
    span = document.createElement('span');
    span.innerHTML = name;
    li.appendChild(span);

    $('sinks').appendChild(li);
};

alljoyn.start(onSource, onSink);
