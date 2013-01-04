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
var onDeviceReady = function() {
    var $ = function(id) {
        return document.getElementById(id);
    };

    var video = $('video'),
        playlist = $('useSources');

    var onStart = function(guid) {
        $('guid').innerHTML = guid;
    };

    var onLoad = function(url) {
        video.src = url;
        video.load();
    };

    var onPlay = function() {
        video.play();
    };

    var onPause = function() {
        video.pause();
    };

    var onPlaylistChanged = function() {
        var i,
            li;

        while (playlist.hasChildNodes()) {
            playlist.removeChild(playlist.lastChild);
        }

        for (i = 0; i < sink.playlist.length; ++i) {
            li = document.createElement('li');
            li.className = 'use';

            span = document.createElement('span');
            if (i === sink.nowPlaying) {
                span.className = 'nowplaying';
            }
            span.innerHTML = sink.playlist[i];
            li.appendChild(span);

            playlist.appendChild(li);
        }

        if (sink.nowPlaying === -1) {
            video.pause();
        }
    };

    navigator.requestPermission('org.alljoyn.bus', function() { 
        sink.start(onStart, onLoad, onPlay, onPause, onPlaylistChanged);
    });
};

if (window.cordova) {
    document.addEventListener('deviceready', onDeviceReady, false);
} else {
    onDeviceReady();
}
