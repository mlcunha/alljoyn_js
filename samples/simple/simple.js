/*
 * Copyright 2011, Qualcomm Innovation Center, Inc.
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

var log = $('log');

var onKeyPress = function(event) {
    var c = event.which ? event.which : event.keyCode,
    message;

    if (c === 13) {
        message = document.forms['message'];
        client.ping(message.text.value);
        message.reset();
        return false;
    }
};

/*
 * The chat log fills the remainder of the vertical height.
 */
var resizeLog = function() {
    var innerHeight = window.innerHeight,
    offsetHeight = log.offsetParent.offsetHeight,
    scrollHeight = log.offsetParent.scrollHeight,
    delta = scrollHeight - offsetHeight;
    log.style.maxHeight = innerHeight - log.offsetTop - delta;
};
window.onload = resizeLog;
window.onresize = resizeLog;

var logLine = function(line) {
    log.appendChild(line);

    /* Scroll the log if needed to show the most recent message at the bottom. */
    log.scrollTop = log.scrollHeight - log.clientHeight;
};

var logPing = function(sender, message) {
    var li,
        timestamp,
        name,
        text;

    li = document.createElement('li');
    timestamp = document.createElement('span');
    timestamp.className = 'timestamp';
    timestamp.innerHTML = '[' + new Date().toLocaleTimeString() + '] ';
    li.appendChild(timestamp);
    name = document.createElement('span');
    name.className = 'sender';
    name.innerHTML = '(' + sender + ') ';
    li.appendChild(name);
    text = document.createElement('span');
    text.className = 'text';
    text.innerHTML = message;
    li.appendChild(text);

    logLine(li);
};

var logStatus = function(message) {
    var li,
        timestamp,
        text;

    li = document.createElement('li');
    timestamp = document.createElement('span');
    timestamp.className = 'timestamp';
    timestamp.innerHTML = '[' + new Date().toLocaleTimeString() + '] ';
    li.appendChild(timestamp);
    text = document.createElement('span');
    text.className = 'text';
    text.innerHTML = message;
    li.appendChild(text);

    logLine(li);
};
