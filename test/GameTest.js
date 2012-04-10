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
AsyncTestCase("GameTest", {
        setUp: function() {
            /*:DOC += <object id="alljoyn" type="application/x-alljoyn"/> */
            alljoyn = document.getElementById("alljoyn");
            bus = new alljoyn.BusAttachment();
        },
        tearDown: function() {
            /*
             * We don't know when the gc will run, so explicitly disconnect to ensure that there is
             * no interference between tests (particularly signal handlers).
             */
            assertEquals(0, bus.disconnect());
        },

        testGame: function(queue) {
            queue.call(function(callbacks) {
                    assertEquals(0, bus.connect());
                    bus.interfaces["org.alljoyn.bus.PlayerState"] = {
                        signal: [
                            { name: "PlayerPosition", signature: "uuu", argNames: "x,y,rotation" }
                        ]
                    };
                    bus["/game/player"] = {
                        "org.alljoyn.bus.PlayerState": {}
                    };
                    var onPlayerPosition = callbacks.add(function(context, x, y, rotation) {
                            assertEquals(100, x);
                            assertEquals(200, y);
                            assertEquals(100, rotation);
                        });
                    assertEquals(0, bus.registerSignalHandler(onPlayerPosition, "org.alljoyn.bus.PlayerState.PlayerPosition"));
                    var onErr = callbacks.addErrback(onError);
                    var onRequestName = callbacks.add(function(context, result) {
                            assertEquals(1, result);
                            bus["/game/player"]["org.alljoyn.bus.PlayerState"].PlayerPosition(100, 200, 100);
                        });
                    var dbus = bus.proxy["org.freedesktop.DBus/org/freedesktop/DBus"];
                    dbus["org.freedesktop.DBus"].RequestName(onRequestName, onErr, "org.alljoyn.bus.game", 0);
                });
        }
    });