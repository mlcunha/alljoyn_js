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
#include "AcceptSessionJoinerListenerNative.h"

#include "SessionOptsHost.h"
#include "TypeMapping.h"
#include <qcc/Debug.h>

#define QCC_MODULE "ALLJOYN_JS"

AcceptSessionJoinerListenerNative::AcceptSessionJoinerListenerNative(Plugin& plugin, NPObject* objectValue)
    : NativeObject(plugin, objectValue)
{
    QCC_DbgTrace(("%s", __FUNCTION__));
}

AcceptSessionJoinerListenerNative::~AcceptSessionJoinerListenerNative()
{
    QCC_DbgTrace(("%s", __FUNCTION__));
}

bool AcceptSessionJoinerListenerNative::onAccept(ajn::SessionPort sessionPort, const qcc::String& joiner, SessionOptsHost& opts)
{
    QCC_DbgTrace(("%s(sessionPort=%d,joiner=%s)", __FUNCTION__, sessionPort, joiner.c_str()));

    NPVariant npargs[3];
    ToUnsignedShort(plugin, sessionPort, npargs[0]);
    ToDOMString(plugin, joiner, npargs[1]);
    ToHostObject<SessionOptsHost>(plugin, opts, npargs[2]);

    bool accepted = false;
    NPVariant result = NPVARIANT_VOID;
    if (NPN_InvokeDefault(plugin->npp, objectValue, npargs, 3, &result)) {
        bool ignore; /* Can convert any JS type into a boolean type. */
        accepted = ToBoolean(plugin, result, ignore);
    }
    NPN_ReleaseVariantValue(&result);

    NPN_ReleaseVariantValue(&npargs[2]);
    NPN_ReleaseVariantValue(&npargs[1]);
    return accepted;
}
