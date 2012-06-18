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
#include "BusObjectNative.h"

#include "TypeMapping.h"
#include <qcc/Debug.h>

#define QCC_MODULE "ALLJOYN_JS"

BusObjectNative::BusObjectNative(Plugin& plugin, NPObject* objectValue)
    : NativeObject(plugin, objectValue)
{
    QCC_DbgTrace(("%s", __FUNCTION__));
}

BusObjectNative::~BusObjectNative()
{
    QCC_DbgTrace(("%s", __FUNCTION__));
}

void BusObjectNative::onRegistered()
{
    QCC_DbgTrace(("%s", __FUNCTION__));
    NPIdentifier onRegistered = NPN_GetStringIdentifier("onRegistered");
    if (NPN_HasMethod(plugin->npp, objectValue, onRegistered)) {
        NPVariant result = NPVARIANT_VOID;
        NPN_Invoke(plugin->npp, objectValue, onRegistered, 0, 0, &result);
        NPN_ReleaseVariantValue(&result);
    }
}

void BusObjectNative::onUnregistered()
{
    QCC_DbgTrace(("%s", __FUNCTION__));
    NPIdentifier onUnregistered = NPN_GetStringIdentifier("onUnregistered");
    if (NPN_HasMethod(plugin->npp, objectValue, onUnregistered)) {
        NPVariant result = NPVARIANT_VOID;
        NPN_Invoke(plugin->npp, objectValue, onUnregistered, 0, 0, &result);
        NPN_ReleaseVariantValue(&result);
    }
}

QStatus BusObjectNative::get(const ajn::InterfaceDescription* iface, const ajn::InterfaceDescription::Property* prop, ajn::MsgArg& val)
{
    QCC_DbgTrace(("%s", __FUNCTION__));

    NPVariant interface = NPVARIANT_VOID;
    NPVariant getter = NPVARIANT_VOID;
    NPVariant value = NPVARIANT_VOID;
    QStatus status = ER_OK;
    bool typeError = false;
    NPVariant nparg;

    if (!NPN_GetProperty(plugin->npp, objectValue, NPN_GetStringIdentifier(iface->GetName()), &interface) ||
        !NPVARIANT_IS_OBJECT(interface)) {
        status = ER_BUS_OBJECT_NO_SUCH_INTERFACE;
        goto exit;
    }

    STRINGN_TO_NPVARIANT(prop->name.c_str(), (uint32_t)prop->name.size(), nparg);
    if (!NPN_Invoke(plugin->npp, NPVARIANT_TO_OBJECT(interface), NPN_GetStringIdentifier("__lookupGetter__"), &nparg, 1, &getter) ||
        !NPVARIANT_IS_OBJECT(getter)) {
        status = ER_FAIL;
        goto exit;
    }

    if (!NPN_InvokeDefault(plugin->npp, NPVARIANT_TO_OBJECT(getter), 0, 0, &value)) {
        status = ER_FAIL;
    }

    ToAny(plugin, value, prop->signature, val, typeError);
    if (typeError) {
        status = ER_FAIL;
    }

exit:
    NPN_ReleaseVariantValue(&value);
    NPN_ReleaseVariantValue(&getter);
    NPN_ReleaseVariantValue(&interface);
    return status;
}

QStatus BusObjectNative::set(const ajn::InterfaceDescription* iface, const ajn::InterfaceDescription::Property* prop, const ajn::MsgArg& val)
{
    QCC_DbgTrace(("%s", __FUNCTION__));

    NPVariant interface = NPVARIANT_VOID;
    NPVariant nparg;
    NPVariant setter = NPVARIANT_VOID;
    NPVariant value = NPVARIANT_VOID;
    NPVariant ignore = NPVARIANT_VOID;
    QStatus status = ER_OK;

    if (!NPN_GetProperty(plugin->npp, objectValue, NPN_GetStringIdentifier(iface->GetName()), &interface) ||
        !NPVARIANT_IS_OBJECT(interface)) {
        status = ER_BUS_OBJECT_NO_SUCH_INTERFACE;
        goto exit;
    }

    STRINGN_TO_NPVARIANT(prop->name.c_str(), (uint32_t)prop->name.size(), nparg);
    if (!NPN_Invoke(plugin->npp, NPVARIANT_TO_OBJECT(interface), NPN_GetStringIdentifier("__lookupSetter__"), &nparg, 1, &setter) ||
        !NPVARIANT_IS_OBJECT(setter)) {
        status = ER_FAIL;
        goto exit;
    }

    ToAny(plugin, val, value, status);
    if (ER_OK != status) {
        goto exit;
    }
    if (!NPN_InvokeDefault(plugin->npp, NPVARIANT_TO_OBJECT(setter), &value, 1, &ignore)) {
        status = ER_FAIL;
    }

exit:
    NPN_ReleaseVariantValue(&ignore);
    NPN_ReleaseVariantValue(&value);
    NPN_ReleaseVariantValue(&setter);
    NPN_ReleaseVariantValue(&interface);
    return status;
}

QStatus BusObjectNative::toXML(bool deep, size_t indent, qcc::String& xml)
{
    QCC_DbgTrace(("%s(deep=%d,indent=%d)", __FUNCTION__, deep, indent));
    QStatus status = ER_NOT_IMPLEMENTED;
    NPIdentifier toXML = NPN_GetStringIdentifier("toXML");
    if (NPN_HasMethod(plugin->npp, objectValue, toXML)) {
        NPVariant npargs[2];
        ToBoolean(plugin, deep, npargs[0]);
        ToUnsignedLong(plugin, indent, npargs[1]);

        NPVariant result = NPVARIANT_VOID;
        if (NPN_Invoke(plugin->npp, objectValue, toXML, npargs, 2, &result) && NPVARIANT_IS_STRING(result)) {
            bool typeError;
            xml = ToDOMString(plugin, result, typeError);
            if (!typeError) {
                status = ER_OK;
            }
        }
        NPN_ReleaseVariantValue(&result);
    }
    return status;
}

void BusObjectNative::onMessage(const char* interfaceName, const char* methodName, MessageReplyHost& message, const ajn::MsgArg* args, size_t numArgs)
{
    QCC_DbgTrace(("%s(args=%p,numArgs=%d)", __FUNCTION__, args, numArgs));
#if !defined(NDEBUG)
    qcc::String str = ajn::MsgArg::ToString(args, numArgs);
    QCC_DbgTrace(("%s", str.c_str()));
#endif

    NPVariant interface = NPVARIANT_VOID;
    NPVariant method = NPVARIANT_VOID;
    NPVariant result = NPVARIANT_VOID;
    QStatus status = ER_OK;
    uint32_t npargCount = 0;
    NPVariant* npargs = 0;
    size_t i;

    npargCount = 1 + numArgs;
    npargs = new NPVariant[npargCount];
    ToHostObject<MessageReplyHost>(plugin, message, npargs[0]);
    for (i = 0; (ER_OK == status) && (i < numArgs); ++i) {
        ToAny(plugin, args[i], npargs[1 + i], status);
    }
    if (ER_OK != status) {
        npargCount = 1 + i;
        goto exit;
    }

    if (!NPN_GetProperty(plugin->npp, objectValue, NPN_GetStringIdentifier(interfaceName), &interface) ||
        !NPVARIANT_IS_OBJECT(interface)) {
        status = ER_BUS_OBJECT_NO_SUCH_INTERFACE;
        goto exit;
    }
    if (!NPN_GetProperty(plugin->npp, NPVARIANT_TO_OBJECT(interface), NPN_GetStringIdentifier(methodName), &method) ||
        !NPVARIANT_IS_OBJECT(method)) {
        status = ER_BUS_OBJECT_NO_SUCH_MEMBER;
        goto exit;
    }
    if (!NPN_InvokeDefault(plugin->npp, NPVARIANT_TO_OBJECT(method), npargs, npargCount, &result)) {
        status = ER_FAIL;
        QCC_LogError(status, ("NPN_InvokeDefault failed"));
    }

exit:
    if ((ER_OK != status) && NPN_HasMethod(plugin->npp, NPVARIANT_TO_OBJECT(npargs[0]), NPN_GetStringIdentifier("replyError"))) {
        NPVariant statusArg;
        INT32_TO_NPVARIANT(status, statusArg);
        NPVariant ignore = NPVARIANT_VOID;
        NPN_Invoke(plugin->npp, NPVARIANT_TO_OBJECT(npargs[0]), NPN_GetStringIdentifier("replyError"), &statusArg, 1, &ignore);
        NPN_ReleaseVariantValue(&ignore);
    }

    for (uint32_t j = 0; j < npargCount; ++j) {
        NPN_ReleaseVariantValue(&npargs[j]);
    }
    delete[] npargs;
    NPN_ReleaseVariantValue(&result);
    NPN_ReleaseVariantValue(&method);
    NPN_ReleaseVariantValue(&interface);
}
