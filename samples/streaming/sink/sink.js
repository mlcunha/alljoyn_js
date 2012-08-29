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

var video = $('video'),
    playlist = $('playlist');

var onPlay = function(url) {
    video.src = url;
    video.load();
    video.play();
}

var onPlaylistChanged = function() {
    var i,
        li;

    while (playlist.hasChildNodes()) {
        playlist.removeChild(playlist.lastChild);
    }

    for (i = 0; i < sink.playlist.length; ++i) {
        li = document.createElement('li');
        li.innerHTML = sink.playlist[i];
        playlist.appendChild(li);
    }
};

sink.start(onPlay, onPlaylistChanged);
