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
(function() {
    var bus = null,
        permissionLevel,
        requestPermission,
        found,
        i;

    /*
     * Check if AllJoyn is already initialized.
     */
    if (window.org && window.org.alljoyn) {
        return;
    }

    if ((typeof navigator.mimeTypes != 'undefined') && navigator.mimeTypes['application/x-alljoyn']) {
        /*
         * Create an object element that will load the AllJoyn plugin.
         */
        bus = document.createElement('object');
        bus.type = 'application/x-alljoyn';
        /*
         * Hide the element.  It's necessary to use the method below instead of changing the
         * visibility to ensure that the plugin has a top-level window for the permission request
         * dialog.
         */
        bus.style.position = 'absolute';
        bus.style.left = 0;
        bus.style.top = -500;
        bus.style.width = 1;
        bus.style.height = 1;
        bus.style.overflow = 'hidden';
        document.documentElement.appendChild(bus);
        /*
         * Check that everything was loaded correctly.
         */
        if (bus && (typeof bus.BusAttachment === 'undefined')) {
            bus = null;
        }
    }
    if (!bus) {
        return;
    }

    /*
     * Put the AllJoyn namespace object in the right place.
     */
    if (!window.org) {
        org = {};
    }
    if (!window.org.alljoyn) {
        window.org.alljoyn = {bus: bus};
    }
    
    /*
     * Until the feature permissions API is supported and available to the plugin, use the fallback
     * implementation in the plugin.
     */
    if (!window.navigator.USER_ALLOWED) {
        window.navigator.USER_ALLOWED = bus.USER_ALLOWED;
        window.navigator.DEFAULT_ALLOWED = bus.DEFAULT_ALLOWED;
        window.navigator.DEFAULT_DENIED = bus.DEFAULT_DENIED;
        window.navigator.USER_DENIED = bus.USER_DENIED;
    }

    permissionLevel = window.navigator.permissionLevel;
    window.navigator.permissionLevel = function(feature) { 
        if (feature === 'org.alljoyn.bus') {
            return bus.permissionLevel(feature);
        } else {
            return permissionLevel(feature);
        }
    }

    requestPermission = window.navigator.requestPermission;
    window.navigator.requestPermission = function(feature, callback) { 
        if (feature === 'org.alljoyn.bus') {
            return bus.requestPermission(feature, callback); 
        } else {
            return requestPermission(feature, callback);
        }
    }
    
    found = false;
    for (i = 0; window.navigator.privilegedFeatures && (i < window.navigator.privilegedFeatures.length); ++i) {
        if (window.navigator.privilegedFeatures[i] === 'org.alljoyn.bus') {
            found = true;
        }
    }
    if (!found) {
        if (window.navigator.privilegedFeatures) {
            window.navigator.privilegedFeatures.push('org.alljoyn.bus');
        } else {
            window.navigator.privilegedFeatures = bus.privilegedFeatures;
        }
    }
})();
