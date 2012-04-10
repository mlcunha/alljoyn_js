var SERVICE_NAME = "trm.session",
    SESSION_PORT = 111;

var start = function() {
    var bus,
        status;

    bus = new org.alljoyn.bus.BusAttachment();

    status = bus.connect();
    if (status) {
        alert("Connect to AllJoyn failed [(" + status + ")]");
    }

    status = bus.bindSessionPort({
            port: SESSION_PORT,
            traffic: org.alljoyn.bus.SessionOpts.TRAFFIC_RAW_RELIABLE,
            transport: org.alljoyn.bus.SessionOpts.TRANSPORT_LOCAL,
            onAccept: function(port, joiner, opts) { 
                return true; 
            },
            onJoined: function(port, id, opts) {
                var fd;

                fd = bus.getSessionFd(id);
                fd.send("http://localhost/~tmalsbar/streaming/file.mp3");
            }
        });
    if (status) {
        alert("Bind session failed [(" + status + ")]");
        return;
    }

    status = bus.requestName(SERVICE_NAME, bus.DBUS_NAME_FLAG_REPLACE_EXISTING | 
                                           bus.DBUS_NAME_FLAG_DO_NOT_QUEUE);
    if (status) {
        alert("Request '" + SERVICE_NAME + "' failed [(" + status + ")]");
        return;
    }
    status = bus.advertiseName(SERVICE_NAME, org.alljoyn.bus.SessionOpts.TRANSPORT_ANY);
    if (status) {
        alert("Advertise '" + SERVICE_NAME + "' failed [(" + status + ")]");
        return;
    }
};

navigator.requestPermission("org.alljoyn.bus", function() { start(); });
