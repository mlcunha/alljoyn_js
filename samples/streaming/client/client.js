/*
 * UI
 */
var $ = function(id) {
    return document.getElementById(id);
}

var video = $("video"),
    events = ["loadstart", "progress", "suspend", "abort", "error", "emptied", "stalled", "loadedmetadata", "loadeddata", "canplay", "canplaythrough", "playing", "waiting", "seeking", "seeked", "ended", "durationchange", "timeupdate", "play", "pause", "ratechange", "volumechange"],
    i;

var logEvent = function(name) {
    return function(evt) {
        console.log(name + ": " + evt);
    };
};
for (i = 0; i < events.length; ++i) {
    video.addEventListener(events[i], logEvent(events[i]));
}

/*
 * AllJoyn
 */
var SERVICE_NAME = "trm.session",
    SESSION_PORT = 111;

var start = function() {
    var bus,
        status;

    var onError = function(error) {
        alert(error.name + ": " + error.message + " (" + error.code + ")");
    };

    bus = new org.alljoyn.bus.BusAttachment();
    bus.registerBusListener({
            onFoundAdvertisedName: function(name, transport, namePrefix) {
                var onJoinSession = function(id, opts) {
                    var fd,
                        url;

                    fd = bus.getSessionFd(id);
                    url = org.alljoyn.bus.SocketFd.createObjectURL(fd);
                    video.src = url;
                    //video.load();
                    //video.play();
                };
                status = bus.joinSession(onJoinSession, onError, {
                        host: name,
                        port: SESSION_PORT,
                        traffic: org.alljoyn.bus.SessionOpts.TRAFFIC_RAW_RELIABLE
                    });
                if (status) {
                    alert("Join session '" + name + "' failed [(" + status + ")]");
                }
            }
        });

    status = bus.connect();
    if (status) {
        alert("Connect to AllJoyn failed [(" + status + ")]");
    }
    status = bus.findAdvertisedName(SERVICE_NAME);
    if (status) {
        alert("Find '" + SERVICE_NAME + "' failed [(" + status + ")]");
    }
};

navigator.requestPermission("org.alljoyn.bus", function() { start(); });
