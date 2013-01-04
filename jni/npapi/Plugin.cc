/*
 * Copyright 2011-2012, Qualcomm Innovation Center, Inc.
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
#include "Plugin.h"

#include "TypeMapping.h"
#include <qcc/Debug.h>
#include <qcc/Util.h>
#include <assert.h>
#include <string.h>

#define QCC_MODULE "ALLJOYN_JS"

QStatus _Plugin::Initialize()
{
    QCC_DbgTrace(("%s", __FUNCTION__));

    QStatus status = ER_OK;
    NPObject* pluginElement = 0;
    NPVariant variant = NPVARIANT_VOID;
    const char* strictEquals = "(function () { return function(a, b) { return a === b; } })();";
    NPString script = { strictEquals, (uint32_t)strlen(strictEquals) };
    NPError ret;

    ret = NPN_GetValue(npp, NPNVPluginElementNPObject, &pluginElement);
    if (NPERR_NO_ERROR != ret) {
        status = ER_FAIL;
        QCC_LogError(status, ("Get PluginElementNPObject failed - %d", ret));
        goto exit;
    }
    /*
     * The below doesn't work on recent chrome: http://code.google.com/p/chromium/issues/detail?id=129570.
     * StrictEquals falls back to pointer comparison, which does work (at least for chrome).
     */
    if (!NPN_Evaluate(npp, pluginElement, &script, &variant)) {
        status = ER_FAIL;
        QCC_LogError(status, ("Evaluate failed"));
        goto exit;
    }
    if (NPVARIANT_IS_OBJECT(variant) && !NPN_SetProperty(npp, pluginElement, NPN_GetStringIdentifier("strictEquals"), &variant)) {
        status = ER_FAIL;
        QCC_LogError(status, ("Set strictEquals failed"));
        goto exit;
    }

exit:
    NPN_ReleaseVariantValue(&variant);
    if (pluginElement) {
        NPN_ReleaseObject(pluginElement);
    }
    return status;
}

QStatus _Plugin::Origin(qcc::String& origin)
{
    QStatus status = ER_OK;
    bool typeError = false;
    NPObject* window = 0;
    NPVariant location = NPVARIANT_VOID;
    NPVariant protocol = NPVARIANT_VOID;
    NPVariant hostname = NPVARIANT_VOID;
    NPVariant port = NPVARIANT_VOID;
    NPVariant document = NPVARIANT_VOID;
    NPVariant domain = NPVARIANT_VOID;

    if (NPERR_NO_ERROR == NPN_GetValue(npp, NPNVWindowNPObject, &window) &&
        NPN_GetProperty(npp, window, NPN_GetStringIdentifier("location"), &location) &&
        NPVARIANT_IS_OBJECT(location) &&
        NPN_GetProperty(npp, NPVARIANT_TO_OBJECT(location), NPN_GetStringIdentifier("protocol"), &protocol) &&
        NPN_GetProperty(npp, NPVARIANT_TO_OBJECT(location), NPN_GetStringIdentifier("hostname"), &hostname) &&
        NPN_GetProperty(npp, NPVARIANT_TO_OBJECT(location), NPN_GetStringIdentifier("port"), &port) &&
        NPN_GetProperty(npp, window, NPN_GetStringIdentifier("document"), &document) &&
        NPVARIANT_IS_OBJECT(document) &&
        NPN_GetProperty(npp, NPVARIANT_TO_OBJECT(document), NPN_GetStringIdentifier("domain"), &domain)) {
        Plugin plugin = Plugin::wrap(this);
        qcc::String protocolString, hostnameString, portString;
        protocolString = ToDOMString(plugin, protocol, typeError) + "//";
        if (typeError) {
            status = ER_FAIL;
            QCC_LogError(status, ("get location.protocol failed"));
            goto exit;
        }
        if (NPVARIANT_IS_STRING(domain)) {
            hostnameString = ToDOMString(plugin, domain, typeError);
        } else {
            hostnameString = ToDOMString(plugin, hostname, typeError);
        }
        if (typeError) {
            status = ER_FAIL;
            QCC_LogError(status, ("get location.hostname or document.domain failed"));
            goto exit;
        }
        portString = ToDOMString(plugin, port, typeError);
        if (typeError) {
            status = ER_FAIL;
            QCC_LogError(status, ("get location.port failed"));
            goto exit;
        }
        origin = protocolString + hostnameString + (portString.empty() ? "" : ":") + portString;
    } else {
        status = ER_FAIL;
        QCC_LogError(status, ("get location or document.domain failed"));
        goto exit;
    }

exit:
    NPN_ReleaseVariantValue(&domain);
    NPN_ReleaseVariantValue(&document);
    NPN_ReleaseVariantValue(&port);
    NPN_ReleaseVariantValue(&hostname);
    NPN_ReleaseVariantValue(&protocol);
    NPN_ReleaseVariantValue(&location);
    NPN_ReleaseObject(window);
    return status;
}

bool _Plugin::StrictEquals(const NPVariant& a, const NPVariant& b) const
{
    bool equals = false;
    if (npp) {
        NPObject* pluginElement = 0;
        NPVariant result = NPVARIANT_VOID;
        NPError error = NPN_GetValue(npp, NPNVPluginElementNPObject, &pluginElement);
        if (NPERR_NO_ERROR == error) {
            NPVariant args[] = { a, b };
            if (NPN_Invoke(npp, pluginElement, NPN_GetStringIdentifier("strictEquals"), args, 2, &result) &&
                NPVARIANT_IS_BOOLEAN(result)) {
                equals = NPVARIANT_TO_BOOLEAN(result);
            } else {
                QCC_LogError(ER_WARNING, ("NPN_Invoke(strictEquals) failed, falling back to pointer comparison"));
                equals = NPVARIANT_TO_OBJECT(a) == NPVARIANT_TO_OBJECT(b);
            }
        } else {
            QCC_LogError(ER_FAIL, ("NPN_GetValue()=%d", error));
        }
        NPN_ReleaseVariantValue(&result);
        if (pluginElement) {
            NPN_ReleaseObject(pluginElement);
        }
    }
    return equals;
}
