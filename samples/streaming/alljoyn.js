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
var onError = function(error) {
    alert(error.name + ': ' + error.message + ' (' + error.code + ')');
};

var addInterfaces = function(bus) {
    bus.interfaces['trm.streaming.Source'] = {
        property: [
            { name: 'Streams', signature: 'a(su)', access: 'read' }
        ],
        signal: [
            { name: 'PropertiesChanged', signature: 'sa{sv}as' }
        ]
    };
    bus.interfaces['trm.streaming.Sink'] = {
        property: [
            { name: 'Playlist', signature: 'as', access: 'read' },
            { name: 'NowPlaying', signature: 'i', access: 'read' }
        ],
        signal: [
            { name: 'PropertiesChanged', signature: 'sa{sv}as' }
        ],
        method: [
            { name: 'Push', signature: 'ssu', argNames: 'fname,name,port' },
            { name: 'Play' },
            { name: 'Pause' },
            { name: 'Previous' },
            { name: 'Next' },
        ]
    };
};

var source = (function() {
    var SERVICE_NAME = 'trm.streaming.source',
        SESSION_PORT = 111,
        OBJECT_PATH = '/trm/streaming/Source';

    var bus,
        sessionId = -1,
        sources = {},
        callbacks = {};

    var start = function(onStart) {
        var status,
            name;

        callbacks = {
            onStart: onStart
        };

        bus = new org.alljoyn.bus.BusAttachment(true);
        callbacks.onStart && callbacks.onStart(bus.globalGUIDString);
        addInterfaces(bus);
        bus[OBJECT_PATH] = {
            'trm.streaming.Source' : {
                get Streams() {
                    var srcs = [],
                        url;

                    for (port in sources) {
                        srcs.push([sources[port].file.name, port]);
                    }
                    return srcs;
                }
            }
        };
        status = bus.connect();
        if (status) {
            alert('Connect to AllJoyn failed [(' + status + ')]');
            return;
        }
        status = bus.bindSessionPort({
            port: SESSION_PORT,
            isMultipoint: true,
            onAccept: function(port, joiner, opts) {
                return true;
            },
            onJoined: function(port, id, joiner) {
                sessionId = id;
				bus.setLinkTimeout(10);
            },
            onLost: function(id) {
                console.log('Lost session id:' + id);
            }
        });
        if (status) {
            alert('Bind session failed [(' + status + ')]');
            return;
        }
        name = SERVICE_NAME + '-' + bus.globalGUIDString;
        status = bus.requestName(name, bus.DBUS_NAME_FLAG_REPLACE_EXISTING |
                                 bus.DBUS_NAME_FLAG_DO_NOT_QUEUE);
        if (status) {
            alert('Request \'' + name + '\' failed [(' + status + ')]');
            return;
        }
        status = bus.advertiseName(name, org.alljoyn.bus.SessionOpts.TRANSPORT_ANY);
        if (status) {
            alert('Advertise \'' + name + '\' failed [(' + status + ')]');
            return;
        }
    };

    var addSource = function(file) {
        var status,
            opts;

        opts = {
            traffic: org.alljoyn.bus.SessionOpts.TRAFFIC_RAW_RELIABLE,
            transport: org.alljoyn.bus.SessionOpts.TRANSPORT_WLAN,
            onAccept: function(port, joiner, opts) { 
                console.log('onAccept port:' + port);
                return true; 
            },
            onJoined: function(port, id, opts) {
                var fd;
                fd = bus.getSessionFd(id);
                sources[port].url = window.URL.createObjectURL(sources[port].file);
                sources[port].id = id;
                console.log('onJoined sending ' + sources[port].url + ' for name ' + sources[port].file.name + ' port:' + port + ' id:' + id);
                fd.send(sources[port].url);
            },
            onLost: function(id) {
                console.log('onLost id:' + id);
                for (port in sources) {
                    if (sources[port].id === id) {
                        if (sources[port].url) {
                            console.log('onLost revoking ' + sources[port].url + ' name:' + sources[port].file.name + ' port:' + port);
                            window.URL.revokeObjectURL(sources[port].url);
                            sources[port].url = null;
                        }
                        break;
                    }
                }
            }
        };        
        status = bus.bindSessionPort(opts);
        if (status) {
            alert('Bind session failed [(' + status + ')]');
            return;
        }

        sources[opts.port] = { 
            url: null,
            file: file,
            id: 0
        };
        console.log('bound ' + file.name + ' to ' + opts.port);
        bus[OBJECT_PATH]['trm.streaming.Source'].PropertiesChanged('trm.streaming.Source', {}, ['Streams'], { sessionId: sessionId });
    };

    var removeSource = function(name) {
        var status;

        for (port in sources) {
            if (sources[port].file.name === name) {
                status = bus.unbindSessionPort(port);
                if (status) {
                    alert('Unbind session failed [(' + status + ')]');
                    return;
                }

                console.log('unbound ' + sources[port].file.name + ' from ' + sources[port].url + ',' + port);
                if (sources[port].url) {
                    window.URL.revokeObjectURL(sources[port].url);
                    sources[port].url = null;
                }
                delete sources[port];
                bus[OBJECT_PATH]['trm.streaming.Source'].PropertiesChanged('trm.streaming.Source', {}, ['Streams'], { sessionId: sessionId });
                break;
            }
        }
    };

    var that = {
        start: start,
        addSource: addSource,
        removeSource: removeSource
    };

    return that;
})();

var sink = (function() {
    var SERVICE_NAME = 'trm.streaming.sink',
        SESSION_PORT = 111,
        OBJECT_PATH = '/trm/streaming/Sink';

    var bus,
        sessionId = -1,
        playlist = [],
        nowPlaying = -1,
        callbacks = {};

    var log = function(prefix) {
        var msg = prefix;
        msg += ': playlist=[';
        for (var i = 0; i < playlist.length; ++i) {
            msg += '{ fname: ' + playlist[i].fname + ', name: ' + playlist[i].name + ', port: ' + playlist[i].port + ' },';
        }
        msg += '],nowPlaying=' + nowPlaying;
        console.log(msg);
    };

    var getPlaylist = function() {
        var pl = [],
            i;

        for (i = 0; i < playlist.length; ++i) {
            pl[i] = playlist[i].fname
        }
        return pl;
    };

    var load = function() {
        var status;

        var onJoined = function(id, opts) {
            var fd,
                url;
                        
            fd = bus.getSessionFd(id);
            url = org.alljoyn.bus.SocketFd.createObjectURL(fd);
            callbacks.onLoad && onLoad(url);
            bus[OBJECT_PATH]['trm.streaming.Sink'].PropertiesChanged('trm.streaming.Sink', {}, ['NowPlaying'], { sessionId: sessionId });
            callbacks.onPlaylistChanged && onPlaylistChanged();
        };

        status = bus.joinSession(onJoined, onError, {
            host: playlist[nowPlaying].name,
            port: playlist[nowPlaying].port,
            traffic: org.alljoyn.bus.SessionOpts.TRAFFIC_RAW_RELIABLE
        });
        if (status) {
            alert("Join session '" + name + "' failed [(" + status + ")]");
        }
    };

    var start = function(onStart, onLoad, onPlay, onPause, onPlaylistChanged) {
        var status,
            name;

        callbacks = {
            onStart: onStart,
            onLoad: onLoad,
            onPlay: onPlay,
            onPause: onPause,
            onPlaylistChanged: onPlaylistChanged
        };

        bus = new org.alljoyn.bus.BusAttachment(true);
        callbacks.onStart && callbacks.onStart(bus.globalGUIDString);
        addInterfaces(bus);
        bus.registerBusListener({
            onNameOwnerChanged: function(name, previousOwner, newOwner) {
                var i,
                    n;

                console.log('onNameOwnerChanged name:' + name + ' previousOwner:' + previousOwner + ' newOwner:' + newOwner);
                n = playlist.length;
                for (i = 0; i < playlist.length; ) {
                    if (previousOwner && !newOwner && playlist[i].mpname === name) {
                        playlist.splice(i, 1);
                        if (i < nowPlaying) {
                            --nowPlaying;
                        } else if (i === nowPlaying) {
                            nowPlaying = -1;
                        }
                    } else {
                        ++i;
                    }
                }
                if (playlist.length !== n) {
                    bus[OBJECT_PATH]['trm.streaming.Sink'].PropertiesChanged('trm.streaming.Sink', {}, ['Playlist', 'NowPlaying'], { sessionId: sessionId });
                    log('onNameOwnerChanged');
                    callbacks.onPlaylistChanged && onPlaylistChanged();
                }
            }
        });
        bus[OBJECT_PATH] = {
            'trm.streaming.Sink' : {
                get Playlist() { return getPlaylist(); },
                get NowPlaying() { return nowPlaying; },
                Push: function(context, fname, name, port) {
                    console.log('Push(' + fname + ',' + name + ',' + port + ')');
                    context.reply();

                    playlist.push({ fname: fname, name: name, port: port, mpname: context.sender });
                    bus[OBJECT_PATH]['trm.streaming.Sink'].PropertiesChanged('trm.streaming.Sink', {}, ['Playlist'], { sessionId: sessionId });
                    if (nowPlaying === -1) {
                        nowPlaying = 0;
                        load();
                    }
                    log('Push');
                    callbacks.onPlaylistChanged && onPlaylistChanged();
                },
                Play: function(context) {
                    console.log('Play()');
                    context.reply();
                    callbacks.onPlay && onPlay();
                },
                Pause: function(context) {
                    console.log('Pause()');
                    context.reply();
                    callbacks.onPause && onPause();
                },
                Previous: function(context) {
                    console.log('Previous()');
                    context.reply();

                    if (playlist.length) {
                        if (nowPlaying > 0) {
                            --nowPlaying;
                        }
                        log('Previous');
                        load();
                    }
                },
                Next: function(context) {
                    console.log('Next()');
                    context.reply();

                    if (playlist.length) {
                        if (nowPlaying < (playlist.length - 1)) {
                            ++nowPlaying;
                        }
                        log('Next');
                        load();
                    }
                },
            }
        };
        status = bus.connect();
        if (status) {
            alert('Connect to AllJoyn failed [(' + status + ')]');
            return;
        }
        status = bus.bindSessionPort({
            port: SESSION_PORT,
            isMultipoint: true,
            onAccept: function(port, joiner, opts) {
                return true;
            },
            onJoined: function(port, id, joiner) {
                sessionId = id;
            },
            onMemberRemoved: function(id, name) {
                console.log('onMemberRemoved: id:' + id + ' name:' + name);
            }
        });
        if (status) {
            alert('Bind session failed [(' + status + ')]');
            return;
        }
        name = SERVICE_NAME + '-' + bus.globalGUIDString;
        status = bus.requestName(name, bus.DBUS_NAME_FLAG_REPLACE_EXISTING |
                                 bus.DBUS_NAME_FLAG_DO_NOT_QUEUE);
        if (status) {
            alert('Request \'' + name + '\' failed [(' + status + ')]');
            return;
        }
        status = bus.advertiseName(name, org.alljoyn.bus.SessionOpts.TRANSPORT_ANY);
        if (status) {
            alert('Advertise \'' + name + '\' failed [(' + status + ')]');
            return;
        }
    };

    var that = {
        get playlist() { return getPlaylist(); },
        get nowPlaying() { return nowPlaying; },
        start: start
    };

    return that;
})();

var browser = (function() {
    var SERVICE_NAME = 'trm.streaming',
        SESSION_PORT = 111;

    var bus,
        sourceId = -1,
        onSourceChanged = null,
        sinkId = -1,
        onSinkChanged = null;

    var getSourceProperties = function(name, sessionId) {
        var proxyObj = bus.proxy[name + '/trm/streaming/Source:sessionId=' + sessionId];
        
        var onGetAll = function(context, props) {
            if (onSourceChanged) {
                onSourceChanged(props);
            }
        };
        proxyObj['org.freedesktop.DBus.Properties'].GetAll(onGetAll, onError, 'trm.streaming.Source');
    };

    var onSourcePropertiesChanged = function(context, name, changed, invalidated) {
        getSourceProperties(context.sender, context.sessionId);
    };

    var joinSource = function(onChanged, name) {
        var status;

        var onJoined = function(id, opts) {
            sourceId = id;
            onSourceChanged = onChanged;
            getSourceProperties(name, sourceId);
        };
        status = bus.joinSession(onJoined, onError, {
            host: name,
            port: SESSION_PORT,
            isMultipoint: true
        });
        if (status) {
            alert('Join session \'' + name + '\' failed [(' + status + ')]');
        }
    };
    var leaveSource = function() {
        if (sourceId !== -1) {
            bus.leaveSession(sourceId);
            sourceId = -1;
            onSourceChanged = null;
        }
    };

    var getSinkProperties = function(name, sessionId) {
        var proxyObj = bus.proxy[name + '/trm/streaming/Sink:sessionId=' + sessionId];
        
        var onGetAll = function(context, props) {
            if (onSinkChanged) {
                onSinkChanged(props);
            }
        };
        proxyObj['org.freedesktop.DBus.Properties'].GetAll(onGetAll, onError, 'trm.streaming.Sink');
    };

    var onSinkPropertiesChanged = function(context, name, changed, invalidated) {
        getSinkProperties(context.sender, context.sessionId);
    };

    var joinSink = function(onChanged, name) {
        var status;

        var onJoined = function(id, opts) {
            sinkId = id;
            onSinkChanged = onChanged;
            getSinkProperties(name, sinkId);
        };
        status = bus.joinSession(onJoined, onError, {
            host: name,
            port: SESSION_PORT,
            isMultipoint: true
        });
        if (status) {
            alert('Join session \'' + name + '\' failed [(' + status + ')]');
        }
    };
    var leaveSink = function() {
        if (sinkId !== -1) {
            bus.leaveSession(sinkId);
            sinkId = -1;
            onSinkChanged = null;
        }
    };

    var start = function(onFoundSource, onLostSource, onFoundSink, onLostSink) {
        var status;

        bus = new org.alljoyn.bus.BusAttachment(true);
        console.log(bus.globalGUIDString);
        addInterfaces(bus);
        bus.registerBusListener({
            onFoundAdvertisedName: function(name, transport, namePrefix) {
                console.log('onFoundAdvertisedName(' + name + ',' + transport + ',' + namePrefix + ')');
                if (name.indexOf('.source') >= 0) {
                    onFoundSource(name);
                } else {
                    onFoundSink(name);
                }
            },
            onLostAdvertisedName: function(name, transport, namePrefix) {
                console.log('onLostAdvertisedName(' + name + ',' + transport + ',' + namePrefix + ')');
                if (name.indexOf('.source') >= 0) {
                    onLostSource(name);
                } else {
                    onLostSink(name);
                }
            }
        });
        
        status = bus.connect();
        if (status) {
            alert('Connect to AllJoyn failed [(' + status + ')]');
        }
        bus.registerSignalHandler(onSourcePropertiesChanged, 'trm.streaming.Source.PropertiesChanged');
        bus.registerSignalHandler(onSinkPropertiesChanged, 'trm.streaming.Sink.PropertiesChanged');
        status = bus.findAdvertisedName(SERVICE_NAME);
        if (status) {
            alert('Find \'' + SERVICE_NAME + '\' failed [(' + status + ')]');
        }
    };

    var push = function(fname, name, port, sink) {
        var proxyObj = bus.proxy[sink + '/trm/streaming/Sink:sessionId=' + sinkId];
        proxyObj['trm.streaming.Sink'].Push(function() {}, onError, fname, name, port);
    };
    
    var play = function(sink) {
        var proxyObj = bus.proxy[sink + '/trm/streaming/Sink:sessionId=' + sinkId];
        proxyObj['trm.streaming.Sink'].Play(function() {}, onError);
    };
    var pause = function(sink) {
        var proxyObj = bus.proxy[sink + '/trm/streaming/Sink:sessionId=' + sinkId];
        proxyObj['trm.streaming.Sink'].Pause(function() {}, onError);
    };
    var previous = function(sink) {
        var proxyObj = bus.proxy[sink + '/trm/streaming/Sink:sessionId=' + sinkId];
        proxyObj['trm.streaming.Sink'].Previous(function() {}, onError);
    };
    var next = function(sink) {
        var proxyObj = bus.proxy[sink + '/trm/streaming/Sink:sessionId=' + sinkId];
        proxyObj['trm.streaming.Sink'].Next(function() {}, onError);
    };

    var that = {
        start: start,
        joinSource: joinSource,
        leaveSource: leaveSource,
        joinSink: joinSink,
        leaveSink: leaveSink,
        push: push,
        play: play,
        pause: pause,
        previous: previous,
        next: next
    };
        
    return that;
})();
