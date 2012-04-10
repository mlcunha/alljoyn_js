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
        var that,
            bus,
            proxy;

        var start = function() {
            var status,
                proxyObj;

            bus = new org.alljoyn.bus.BusAttachment(true);
            status = bus.connect();
            if (status) {
                alert("Connect to AllJoyn failed [(" + status + ")]");
                return;
            }

            proxyObj = bus.proxy["org.alljoyn.bus.samples.props/testProperties"];
            /*
             * Property Get, Set, and GetAll methods are part of the org.freedesktop.DBus.Properties
             * interface implemented by all objects containing properties.  The methods take the
             * property name and the interface name it is a part of as parameters.
             */
            proxy = proxyObj["org.freedesktop.DBus.Properties"];

            that.getAll();
        };        

        that = {};

        that.start = function() {
            navigator.requestPermission("org.alljoyn.bus", function() { start(); });
        }

        that.getStringProp = function() {
            var onGet,
                onError;

            onGet = function(context, value) {
                /*
                 * The method returnSignature of org.freedesktop.DBus.Properties.Get is "v", an
                 * AllJoyn VARIANT.  Incoming variants strip the outermost variant wrapper of their
                 * value.  So you see value used directly instead of value.s.
                 */
                that.onstringprop(value);
            };
            onError = function(error) {
                alert("Get 'StringProp' failed " + error);
            };
            /*
             * Get the "StringProp" property of the "org.alljoyn.bus.samples.props.PropsInterface"
             * interface of the remote object.
             */
            proxy.Get(onGet, onError, "org.alljoyn.bus.samples.props.PropsInterface", "StringProp");
        };
        
        that.setStringProp = function(value) {
            var onSet,
                onError;

            onSet = function(context) {
                that.onstringprop(value);
            }
            onError = function(error) {
                alert("Set 'StringProp' failed " + error);
            };
            /*
             * Set the "StringProp" property of the "org.alljoyn.bus.samples.props.PropsInterface"
             * interface of the remote object.  The method signature of
             * org.freedesktop.DBus.Properties.Set is "v", an AllJoyn VARIANT.  Outgoing variants
             * must specify the signature of their value, so you see { "s": value } passed as the
             * argument to Set to indicate a STRING value.
             */
            proxy.Set(onSet, onError, "org.alljoyn.bus.samples.props.PropsInterface", "StringProp", { "s": value });
        };

        that.getIntProp = function() {
            var onGet,
                onError;

            onGet = function(context, value) {
                that.onintprop(value);
            };
            onError = function(error) {
                alert("Get 'IntProp' failed " + error);
            };
            proxy.Get(onGet, onError, "org.alljoyn.bus.samples.props.PropsInterface", "IntProp");
        };
        
        that.setIntProp = function(value) {
            var onSet,
                onError;

            onSet = function(context) {
                that.onintprop(value);
            }
            onError = function(error) {
                alert("Get 'IntProp' failed " + error);
            };
            proxy.Set(onSet, onError, "org.alljoyn.bus.samples.props.PropsInterface", "IntProp", { "i": value });
        };
        
        that.getAll = function() {
            var onGet,
                onError;

            onGet = function(context, values) {
                /*
                 * The method returnSignature of org.freedesktop.DBus.Properties.GetAll is "a{sv}",
                 * an array of string to variant DICT_ENTRYs.  Incoming variants strip the outermost
                 * variant wrapper of their value, so you see values.StringProp used directly
                 * instead of values.StringProp.s (similarly values.IntProp instead of
                 * values.IntProp.i).
                 */
                that.onstringprop(values.StringProp);
                that.onintprop(values.IntProp);
            };
            onError = function(error) {
                alert("Get all properties failed " + error);
            };
            proxy.GetAll(onGet, onError, "org.alljoyn.bus.samples.props.PropsInterface");
        };

        return that;
    }());
