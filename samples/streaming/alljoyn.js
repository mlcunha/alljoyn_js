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
            { name: 'Playlist', signature: 'as', access: 'read' }
        ],
        signal: [
            { name: 'PropertiesChanged', signature: 'sa{sv}as' }
        ],
        method: [
            { name: 'Push', signature: 'ssu', argNames: 'fname,name,port' },
            { name: 'Play' }
        ]
    };
};

var source = (function() {
    var SERVICE_NAME = 'trm.streaming.source',
        SESSION_PORT = 111,
        OBJECT_PATH = '/trm/streaming/Source';

    var bus,
        sessionId = -1,
        sources = {};

    var start = function() {
        var status,
            name;

        bus = new org.alljoyn.bus.BusAttachment(true);
        addInterfaces(bus);
        bus[OBJECT_PATH] = {
            'trm.streaming.Source' : {
                get Streams() {
                    var srcs = [],
                        url;

                    for (url in sources) {
                        srcs.push([sources[url].name, sources[url].port]);
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

    var addSource = function(url, name) {
        var status,
            opts;

        opts = {
            traffic: org.alljoyn.bus.SessionOpts.TRAFFIC_RAW_RELIABLE,
            transport: org.alljoyn.bus.SessionOpts.TRANSPORT_WLAN,
            onAccept: function(port, joiner, opts) { 
                return true; 
            },
            onJoined: function(port, id, opts) {
                var fd;
                
                fd = bus.getSessionFd(id);
                fd.send(url);
            }
        };        
        status = bus.bindSessionPort(opts);
        if (status) {
            alert('Bind session failed [(' + status + ')]');
            return;
        }

        sources[url] = { 
            name: name,
            port: opts.port
        };
        console.log('bound ' + url + ' to ' + sources[url].name + ',' + sources[url].port);
        bus[OBJECT_PATH]['trm.streaming.Source'].PropertiesChanged('trm.streaming.Source', {}, ['Streams'], { sessionId: sessionId });
    };

    var removeSource = function(url) {
        var status;

        status = bus.unbindSessionPort(sources[url].port);
        if (status) {
            alert('Unbind session failed [(' + status + ')]');
            return;
        }

        console.log('unbound ' + url + ' from ' + sources[url].name + ',' + sources[url].port);
        delete sources[url];
        bus[OBJECT_PATH]['trm.streaming.Source'].PropertiesChanged('trm.streaming.Source', {}, ['Streams'], { sessionId: sessionId });
    };

    var that = {};

    that.start = function() {
        navigator.requestPermission('org.alljoyn.bus', function() { start(); });
    };
    that.addSource = addSource;
    that.removeSource = removeSource;

    return that;
})();

var sink = (function() {
    var SERVICE_NAME = 'trm.streaming.sink',
        SESSION_PORT = 111,
        OBJECT_PATH = '/trm/streaming/Sink';

    var bus,
        sessionId = -1,
        playlist = [];

    var getPlaylist = function() {
        var pl = [],
            i;

        for (i = 0; i < playlist.length; ++i) {
            pl[i] = playlist[i].fname
        }
        return pl;
    };

    var start = function(onPlay, onPlaylistChanged) {
        var status,
            name;

        bus = new org.alljoyn.bus.BusAttachment(true);
        addInterfaces(bus);
        bus.registerBusListener({
            onNameOwnerChanged: function(name, previousOwner, newOwner) {
                var i,
                    n;

                n = playlist.length;
                for (i = 0; i < playlist.length; ) {
                    if (previousOwner && !newOwner && playlist[i].name === name) {
                        playlist.splice(i, 1);
                    } else {
                        ++i;
                    }
                }
                if (playlist.length !== n) {
                    bus[OBJECT_PATH]['trm.streaming.Sink'].PropertiesChanged('trm.streaming.Sink', {}, ['Playlist'], { sessionId: sessionId });
                }
            }
        });
        bus[OBJECT_PATH] = {
            'trm.streaming.Sink' : {
                get Playlist() { return getPlaylist(); },
                Push: function(context, fname, name, port) {
                    console.log('Push(' + fname + ',' + name + ',' + port + ')');
                    context.reply();

                    playlist.push({ fname: fname, name: name, port: port });
                    bus[OBJECT_PATH]['trm.streaming.Sink'].PropertiesChanged('trm.streaming.Sink', {}, ['Playlist'], { sessionId: sessionId });
                    // TODO onPlaylistChanged();
                },
                Play: function(context) {
                    var status;

                    var onJoinSession = function(id, opts) {
                        var fd,
                            url;
                        
                        fd = bus.getSessionFd(id);
                        url = org.alljoyn.bus.SocketFd.createObjectURL(fd);
                        onPlay(url);
                    };
                    status = bus.joinSession(onJoinSession, onError, {
                        host: playlist[0].name,
                        port: playlist[0].port,
                        traffic: org.alljoyn.bus.SessionOpts.TRAFFIC_RAW_RELIABLE
                    });
                    if (status) {
                        alert("Join session '" + name + "' failed [(" + status + ")]");
                    }
                    context.reply();
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
        get playlist() { return getPlaylist(); }
    };

    that.start = function(onPlay, onPlaylistChanged) {
        navigator.requestPermission('org.alljoyn.bus', function() { start(onPlay, onPlaylistChanged); });
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
        
        var onPush = function(context) {
        };
        proxyObj['trm.streaming.Sink'].Push(onPush, onError, fname, name, port);
    };
    
    var play = function(sink) {
        var proxyObj = bus.proxy[sink + '/trm/streaming/Sink:sessionId=' + sinkId];
        
        var onPlay = function(context) {
        };
        proxyObj['trm.streaming.Sink'].Play(onPlay, onError);
    };

    var that = {};
        
    that.start = function(onFoundSource, onLostSource, onFoundSink, onLostSink) {
        navigator.requestPermission('org.alljoyn.bus', function() { start(onFoundSource, onLostSource, onFoundSink, onLostSink); });
    };
    that.joinSource = joinSource;
    that.leaveSource = leaveSource;
    that.joinSink = joinSink;
    that.leaveSink = leaveSink;
    that.push = push;
    that.play = play;

    return that;
})();
