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
var alljoyn = (function() {
        var NAME = "org.alljoyn.bus.samples.props",
            OBJECT_PATH = "/testProperties";

        var that,
            bus;

        var start = function() {
            var status;

            bus = new org.alljoyn.bus.BusAttachment(true);
            status = bus.connect();
            if (status) {
                alert("Connect to AllJoyn failed [(" + status + ")]");
                return;
            }
            bus.interfaces["org.alljoyn.bus.samples.props.PropsInterface"] = {
                /*
                 * Specify two properties of this interface, a string property and an integer
                 * property.  Both properties can be got and set.
                 */
                property: [
                    { name: "StringProp", signature: "s", access: "readwrite" },
                    { name: "IntProp", signature: "i", access: "readwrite" }
                ]
            };
            bus[OBJECT_PATH] = (function() {
                    var stringProp = "Hello";
                    var intProp = 6;
                    /*
                     * An implementation of PropsInterface.  Property get and set implementations
                     * are implemented as JavaScript getters and setters.  The JavaScript name of
                     * the property is identical to the name specified in the AllJoyn interface.
                     */
                    return {
                        "org.alljoyn.bus.samples.props.PropsInterface": {
                            get StringProp() { return stringProp; },
                            set StringProp(value) { 
                                stringProp = value; 
                                that.onstringprop(stringProp);
                            },
                            get IntProp() { return intProp; },
                            set IntProp(value) { 
                                intProp = value; 
                                that.onintprop(intProp);
                            }
                        }
                    };
                }());
            status = bus.requestName(NAME);
            if (status) {
                alert("Request name '" + NAME + "' failed [(" + status + ")]");
                return;
            }

            that.onstringprop(bus[OBJECT_PATH]["org.alljoyn.bus.samples.props.PropsInterface"].StringProp);
            that.onintprop(bus[OBJECT_PATH]["org.alljoyn.bus.samples.props.PropsInterface"].IntProp);
        };

        that = {};

        that.start = function() {
            navigator.requestPermission("org.alljoyn.bus", function() { start(); });
        }
        
        return that;
    }());
