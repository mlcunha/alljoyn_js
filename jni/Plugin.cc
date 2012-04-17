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
#include "Plugin.h"

#include "TypeMapping.h"
#include <qcc/Debug.h>
#include <qcc/Util.h>
#include <assert.h>
#include <string.h>

#define QCC_MODULE "ALLJOYN_JS"

_Plugin::_Plugin(NPP npp)
    : npp(npp)
#if defined(QCC_OS_ANDROID)
    , context(0)
    , securityClient(0)
#endif
{
    QCC_DbgTrace(("%s", __FUNCTION__));
}

_Plugin::_Plugin()
    : npp(0)
#if defined(QCC_OS_ANDROID)
    , context(0)
    , securityClient(0)
#endif
{
    QCC_DbgTrace(("%s", __FUNCTION__));
}

QStatus _Plugin::Initialize()
{
    QStatus status = ER_OK;
    NPObject* pluginElement = 0;
    NPVariant variant = NPVARIANT_VOID;
    const char* strictEquals = "(function () { return function(a, b) { return a === b; } })();";
    NPString script = { strictEquals, strlen(strictEquals) };
    NPError ret;
#if defined(QCC_OS_ANDROID)
    jint jret;
    JNIEnv* env;
    jobject obj;
    jclass clazz;
    jmethodID mid;
    qcc::String origin;
    jstring jorigin;
#endif

    ret = NPN_GetValue(npp, NPNVPluginElementNPObject, &pluginElement);
    if (NPERR_NO_ERROR != ret) {
        status = ER_FAIL;
        QCC_LogError(status, ("Get PluginElementNPObject failed - %d", ret));
        goto exit;
    }
    if (!NPN_Evaluate(npp, pluginElement, &script, &variant)) {
        status = ER_FAIL;
        QCC_LogError(status, ("Evaluate failed"));
        goto exit;
    }
    if (!NPN_SetProperty(npp, pluginElement, NPN_GetStringIdentifier("strictEquals"), &variant)) {
        status = ER_FAIL;
        QCC_LogError(status, ("Set strictEquals failed"));
        goto exit;
    }

#if defined(QCC_OS_ANDROID)
    system.inSize = sizeof(system);
    ret = NPN_GetValue(NULL, kSystemInterfaceV0_ANPGetValue, &system);
    if (NPERR_NO_ERROR != ret) {
        status = ER_FAIL;
        QCC_LogError(status, ("SystemInterface not available - %d", ret));
        goto exit;
    }

    ret = NPN_GetValue(npp, kJavaContext_ANPGetValue, static_cast<void*>(&obj));
    if (NPERR_NO_ERROR != ret) {
        status = ER_FAIL;
        QCC_LogError(status, ("Get JavaContext failed - %d", ret));
        goto exit;
    }
    jret = gVM->GetEnv((void** )&env, JNI_VERSION_1_4);
    if (JNI_OK != jret) {
        status = ER_FAIL;
        QCC_LogError(status, ("GetEnv failed - %d", jret));
        goto exit;
    }
    context = env->NewGlobalRef(obj);
    if (!context) {
        status = ER_FAIL;
        QCC_LogError(status, ("NewGlobalRef failed"));
        goto exit;
    }

    clazz = system.loadJavaClass(npp, "org.alljoyn.bus.plugin.SecurityClient");
    if (!clazz) {
        status = ER_FAIL;
        QCC_LogError(status, ("loadJavaClass failed"));
        goto exit;
    }
    mid = env->GetMethodID(clazz, "<init>", "(Landroid/content/Context;Ljava/lang/String;)V");
    if (!mid) {
        status = ER_FAIL;
        QCC_LogError(status, ("Get SecurityClient.<init> method failed"));
        goto exit;
    }
    status = Origin(origin);
    if (ER_OK != status) {
        goto exit;
    }
    jorigin = env->NewStringUTF(origin.c_str());
    if (!jorigin) {
        status = ER_FAIL;
        QCC_LogError(status, ("New String failed"));
        goto exit;
    }
    obj = env->NewObject(clazz, mid, context, jorigin);
    if (!obj) {
        status = ER_FAIL;
        QCC_LogError(status, ("New SecurityClient failed"));
        goto exit;
    }
    securityClient = env->NewGlobalRef(obj);
    if (!securityClient) {
        status = ER_FAIL;
        QCC_LogError(status, ("NewGlobalRef failed"));
        goto exit;
    }
#endif

exit:
    NPN_ReleaseVariantValue(&variant);
    if (pluginElement) {
        NPN_ReleaseObject(pluginElement);
    }
    if (ER_OK != status) {
#if defined(QCC_OS_ANDROID)
        if (env && env->ExceptionCheck()) {
            env->ExceptionDescribe();
            env->ExceptionClear();
        }
        if (securityClient) {
            env->DeleteGlobalRef(securityClient);
            securityClient = 0;
        }
        if (context) {
            env->DeleteGlobalRef(context);
            context = 0;
        }
#endif
    }
    return status;
}

_Plugin::~_Plugin()
{
    QCC_DbgTrace(("%s", __FUNCTION__));
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
            }
        }
        NPN_ReleaseVariantValue(&result);
        if (pluginElement) {
            NPN_ReleaseObject(pluginElement);
        }
    }
    return equals;
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
        Plugin plugin(this);
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

qcc::String _Plugin::ToFilename(const qcc::String& in)
{
    qcc::String url = in;
    QCC_DbgPrintf(("unencoded url=%s", url.c_str()));
    for (size_t i = 0; i < url.size(); ++i) {
        switch (url[i]) {
        case '$':
        case '-':
        case '_':
        case '.':
        case '+':
        case '!':
        case '*':
        case '\'':
        case '(':
        case ')':
        case ',':
        case ';':
        case '/':
        case '?':
        case ':':
        case '@':
        case '=':
        case '&': {
            char encoded[3];
            snprintf(encoded, 3, "%02X", url[i]);
            url[i] = '%';
            url.insert(i + 1, encoded, 2);
            i += 2;
            break;
        }

        default:
            /* Do nothing */
            break;
        }
    }
    QCC_DbgPrintf(("encoded url=%s", url.c_str()));
    return url;
}

bool _Plugin::RaiseBusError(QStatus code, const char* message)
{
    _error.name = "BusError";
    _error.message = message;
    _error.code = code;
    QCC_LogError(_error.code, ("%s: %s", _error.name.c_str(), _error.message.c_str()));
    return false;
}

bool _Plugin::RaiseTypeError(const char* message)
{
    _error.name = "TypeError";
    _error.message = message;
    QCC_LogError(_error.code, ("%s: %s", _error.name.c_str(), _error.message.c_str()));
    return false;
}

void _Plugin::CheckError(NPObject* npobj)
{
    if (!_error.name.empty()) {
        error = _error;
        _error.Clear();
        NPN_SetException(npobj, error.message.c_str());
    }
}
