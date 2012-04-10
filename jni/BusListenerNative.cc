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
#include "BusListenerNative.h"

#include "BusAttachmentHost.h"
#include "TypeMapping.h"
#include <qcc/Debug.h>

#define QCC_MODULE "ALLJOYN_JS"

BusListenerNative::BusListenerNative(Plugin& plugin, NPObject* objectValue)
    : NativeObject(plugin, objectValue)
{
    QCC_DbgTrace(("%s", __FUNCTION__));
}

BusListenerNative::~BusListenerNative()
{
    QCC_DbgTrace(("%s", __FUNCTION__));
}

void BusListenerNative::onRegistered(BusAttachmentHost& busAttachment)
{
    QCC_DbgTrace(("%s", __FUNCTION__));
    NPIdentifier onRegistered = NPN_GetStringIdentifier("onRegistered");
    if (NPN_HasMethod(plugin->npp, objectValue, onRegistered)) {
        NPVariant npargs[1];
        ToHostObject<BusAttachmentHost>(plugin, busAttachment, npargs[0]);

        NPVariant result = NPVARIANT_VOID;
        NPN_Invoke(plugin->npp, objectValue, onRegistered, npargs, 1, &result);

        NPN_ReleaseVariantValue(&npargs[0]);
        NPN_ReleaseVariantValue(&result);
    }
}

void BusListenerNative::onUnregistered()
{
    QCC_DbgTrace(("%s", __FUNCTION__));
    NPIdentifier onUnregistered = NPN_GetStringIdentifier("onUnregistered");
    if (NPN_HasMethod(plugin->npp, objectValue, onUnregistered)) {
        NPVariant result = NPVARIANT_VOID;
        NPN_Invoke(plugin->npp, objectValue, onUnregistered, 0, 0, &result);
        NPN_ReleaseVariantValue(&result);
    }
}

void BusListenerNative::onFoundAdvertisedName(const qcc::String& name, ajn::TransportMask transport, const qcc::String& namePrefix)
{
    QCC_DbgTrace(("%s(name=%s,transport=0x%x,namePrefix=%s)", __FUNCTION__, name.c_str(), transport, namePrefix.c_str()));
    NPIdentifier onFoundAdvertisedName = NPN_GetStringIdentifier("onFoundAdvertisedName");
    if (NPN_HasMethod(plugin->npp, objectValue, onFoundAdvertisedName)) {
        NPVariant npargs[3];
        ToDOMString(plugin, name, npargs[0]);
        ToUnsignedShort(plugin, transport, npargs[1]);
        ToDOMString(plugin, namePrefix, npargs[2]);

        NPVariant result = NPVARIANT_VOID;
        NPN_Invoke(plugin->npp, objectValue, onFoundAdvertisedName, npargs, 3, &result);
        NPN_ReleaseVariantValue(&result);

        NPN_ReleaseVariantValue(&npargs[2]);
        NPN_ReleaseVariantValue(&npargs[0]);
    }
}

void BusListenerNative::onLostAdvertisedName(const qcc::String& name, ajn::TransportMask transport, const qcc::String& namePrefix)
{
    QCC_DbgTrace(("%s(name=%s,transport=0x%x,namePrefix=%s)", __FUNCTION__, name.c_str(), transport, namePrefix.c_str()));
    NPIdentifier onLostAdvertisedName = NPN_GetStringIdentifier("onLostAdvertisedName");
    if (NPN_HasMethod(plugin->npp, objectValue, onLostAdvertisedName)) {
        NPVariant npargs[3];
        ToDOMString(plugin, name, npargs[0]);
        ToUnsignedShort(plugin, transport, npargs[1]);
        ToDOMString(plugin, namePrefix, npargs[2]);

        NPVariant result = NPVARIANT_VOID;
        NPN_Invoke(plugin->npp, objectValue, onLostAdvertisedName, npargs, 3, &result);
        NPN_ReleaseVariantValue(&result);

        NPN_ReleaseVariantValue(&npargs[2]);
        NPN_ReleaseVariantValue(&npargs[0]);
    }
}

void BusListenerNative::onNameOwnerChanged(const qcc::String& busName, const qcc::String& previousOwner, const qcc::String& newOwner)
{
    QCC_DbgTrace(("%s(busName=%s,previousOwner=%s,newOwner=%s)", __FUNCTION__, busName.c_str(), previousOwner.c_str(), newOwner.c_str()));
    NPIdentifier onNameOwnerChanged = NPN_GetStringIdentifier("onNameOwnerChanged");
    if (NPN_HasMethod(plugin->npp, objectValue, onNameOwnerChanged)) {
        NPVariant npargs[3];
        ToDOMString(plugin, busName, npargs[0]);
        ToDOMString(plugin, previousOwner, npargs[1], TreatEmptyStringAsNull);
        ToDOMString(plugin, newOwner, npargs[2], TreatEmptyStringAsNull);

        NPVariant result = NPVARIANT_VOID;
        NPN_Invoke(plugin->npp, objectValue, onNameOwnerChanged, npargs, 3, &result);
        NPN_ReleaseVariantValue(&result);

        NPN_ReleaseVariantValue(&npargs[2]);
        NPN_ReleaseVariantValue(&npargs[1]);
        NPN_ReleaseVariantValue(&npargs[0]);
    }
}

void BusListenerNative::onStopping()
{
    QCC_DbgTrace(("%s", __FUNCTION__));
    NPIdentifier onStopping = NPN_GetStringIdentifier("onStopping");
    if (NPN_HasMethod(plugin->npp, objectValue, onStopping)) {
        NPVariant result = NPVARIANT_VOID;
        NPN_Invoke(plugin->npp, objectValue, onStopping, 0, 0, &result);
        NPN_ReleaseVariantValue(&result);
    }
}

void BusListenerNative::onDisconnected()
{
    QCC_DbgTrace(("%s", __FUNCTION__));
    NPIdentifier onDisconnected = NPN_GetStringIdentifier("onDisconnected");
    if (NPN_HasMethod(plugin->npp, objectValue, onDisconnected)) {
        NPVariant result = NPVARIANT_VOID;
        NPN_Invoke(plugin->npp, objectValue, onDisconnected, 0, 0, &result);
        NPN_ReleaseVariantValue(&result);
    }
}
