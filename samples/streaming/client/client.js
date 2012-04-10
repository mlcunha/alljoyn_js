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
                        url,
                        audio;

                    fd = bus.getSessionFd(id);
                    url = org.alljoyn.bus.SocketFd.createObjectURL(fd);
                    audio = document.getElementById("audio");
                    audio.src = url;
                    audio.load();
                    audio.play();
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
