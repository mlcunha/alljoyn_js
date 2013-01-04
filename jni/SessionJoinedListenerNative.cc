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
#include "SessionJoinedListenerNative.h"

#include "TypeMapping.h"
#include <qcc/Debug.h>

#define QCC_MODULE "ALLJOYN_JS"

SessionJoinedListenerNative::SessionJoinedListenerNative(Plugin& plugin, NPObject* objectValue)
    : NativeObject(plugin, objectValue)
{
    QCC_DbgTrace(("%s", __FUNCTION__));
}

SessionJoinedListenerNative::~SessionJoinedListenerNative()
{
    QCC_DbgTrace(("%s", __FUNCTION__));
}

void SessionJoinedListenerNative::onJoined(ajn::SessionPort sessionPort, ajn::SessionId id, const qcc::String& joiner)
{
    QCC_DbgTrace(("%s(sessionPort=%d,id=%u,joiner=%s)", __FUNCTION__, sessionPort, id, joiner.c_str()));

    NPVariant npargs[3];
    ToUnsignedShort(plugin, sessionPort, npargs[0]);
    ToUnsignedLong(plugin, id, npargs[1]);
    ToDOMString(plugin, joiner, npargs[2]);

    NPVariant result = NPVARIANT_VOID;
    NPN_InvokeDefault(plugin->npp, objectValue, npargs, 3, &result);
    NPN_ReleaseVariantValue(&result);

    NPN_ReleaseVariantValue(&npargs[2]);
}
