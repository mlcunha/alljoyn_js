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
}

var joinChannelButton = $('joinChannelButton'),
    log = $('log'),
    startChannelButton = $('startChannelButton'),
    tabHost = $('tabHost'),
    tabHostButton = $('tabHostButton'),
    tabUse = $('tabUse'),
    tabUseButton = $('tabUseButton');

var onKeyPress = function(event) {
    var c = event.which ? event.which : event.keyCode,
        message;

    if (c === 13) {
        message = document.forms['message'];
        alljoyn.chat(message.text.value);
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

joinChannelButton.onclick = function() {
    var channelNames = document.forms['joinChannel'].channelNames,
        channelName = channelNames.value,
        onJoined,
        onError,
        err;

    if (joinChannelButton.innerHTML === 'Join') {
        onJoined = function() {
            while (log.hasChildNodes()) {
                log.removeChild(log.firstChild);
            }
            channelNames.disabled = true;
            joinChannelButton.innerHTML = 'Leave';
            joinChannelButton.disabled = false;
        };
        onError = function() {
            joinChannelButton.disabled = false;
        };
        err = alljoyn.joinChannel(onJoined, onError, channelName);
        if (!err) {
            joinChannelButton.disabled = true;
        }
    } else {
        err = alljoyn.leaveChannel();
        if (!err) {
            joinChannelButton.innerHTML = 'Join';
            alljoyn.onname();   /* Refresh list of channels being advertised. */
        }
    }
    return false;
};

startChannelButton.onclick = function() {
    var channelName = document.forms['setChannel'].channelName,
        err;

    if (startChannelButton.innerHTML === 'Start') {
        err = alljoyn.startChannel(channelName.value);
        if (!err) {
            startChannelButton.innerHTML = 'Stop';
            channelName.disabled = true;
        }
    } else {
        err = alljoyn.stopChannel();
        if (!err) {
            startChannelButton.innerHTML = 'Start';
            channelName.disabled = false;
        }
    }
    return false;
};

alljoyn.onname = function() {
    var channelNames = document.forms['joinChannel'].channelNames,
        i,
        option;

    /*
     * Don't touch the channel list while we are joined.  The session can be "stopped" by the host,
     * but it is still alive for any joined parties.
     */
    if (joinChannelButton.innerHTML === 'Leave') {
        return;
    }

    while (channelNames.hasChildNodes()) {
        channelNames.removeChild(channelNames.firstChild);
    }
    if (alljoyn.channelNames.length) {
        for (i = 0; i < alljoyn.channelNames.length; ++i) {
            option = document.createElement('option');
            option.innerHTML = alljoyn.channelNames[i];
            channelNames.appendChild(option);
        }
        channelNames.disabled = false;
        joinChannelButton.disabled = false;
    } else {
        option = document.createElement('option');
        option.innerHTML = 'Searching...';
        channelNames.appendChild(option);
        channelNames.disabled = true;
        joinChannelButton.disabled = true;
    }
};
alljoyn.onchat = function(sender, message) {
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

    log.appendChild(li);

    /* Scroll the log if needed to show the most recent message at the bottom. */
    log.scrollTop = log.scrollHeight - log.clientHeight;
};
alljoyn.onlost = function(name) {
    joinChannelButton.innerHTML = 'Join';
    alljoyn.onname();   /* Refresh list of channels being advertised. */
}

/* The initial state of the page. */
tabUseButton.onclick();

alljoyn.start();
