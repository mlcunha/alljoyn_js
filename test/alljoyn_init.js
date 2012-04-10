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
(function() {
    var bus = null,
        permissionLevel,
        requestPermission,
        found,
        i;

    /*
     * Check if AllJoyn is already initialized.
     */
    if (window.org && org.alljoyn) {
        return;
    }

    /*
     * Create an object element that will load the AllJoyn plugin.
     */
    if ((typeof navigator.mimeTypes != 'undefined') && navigator.mimeTypes['application/x-alljoyn']) {
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
    if (!org.alljoyn) {
        org.alljoyn = {bus: bus};
    }
    
    /*
     * Until the feature permissions API is supported and available to the plugin, use the fallback
     * implementation in the plugin.
     */
    if (!navigator.USER_ALLOWED) {
        navigator.USER_ALLOWED = bus.USER_ALLOWED;
        navigator.DEFAULT_ALLOWED = bus.DEFAULT_ALLOWED;
        navigator.DEFAULT_DENIED = bus.DEFAULT_DENIED;
        navigator.USER_DENIED = bus.USER_DENIED;
    }

    permissionLevel = navigator.permissionLevel;
    navigator.permissionLevel = function(feature) { 
        if (feature === 'org.alljoyn.bus') {
            return bus.permissionLevel(feature);
        } else {
            return permissionLevel(feature);
        }
    }

    requestPermission = navigator.requestPermission;
    navigator.requestPermission = function(feature, callback) { 
        if (feature === 'org.alljoyn.bus') {
            return bus.requestPermission(feature, callback); 
        } else {
            return requestPermission(feature, callback);
        }
    }
    
    found = false;
    for (i = 0; navigator.privilegedFeatures && (i < navigator.privilegedFeatures.length); ++i) {
        if (navigator.privilegedFeatures[i] === 'org.alljoyn.bus') {
            found = true;
        }
    }
    if (!found) {
        if (navigator.privilegedFeatures) {
            navigator.privilegedFeatures.push('org.alljoyn.bus');
        } else {
            navigator.privilegedFeatures = bus.privilegedFeatures;
        }
    }
})();
