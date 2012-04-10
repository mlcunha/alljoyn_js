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
#include "JoinSessionSuccessListenerNative.h"

#include "TypeMapping.h"
#include <qcc/Debug.h>

#define QCC_MODULE "ALLJOYN_JS"

JoinSessionSuccessListenerNative::JoinSessionSuccessListenerNative(Plugin& plugin, NPObject* objectValue)
    : NativeObject(plugin, objectValue)
{
    QCC_DbgTrace(("%s", __FUNCTION__));
}

JoinSessionSuccessListenerNative::~JoinSessionSuccessListenerNative()
{
    QCC_DbgTrace(("%s", __FUNCTION__));
}

void JoinSessionSuccessListenerNative::onSuccess(ajn::SessionId id, SessionOptsHost& opts)
{
    QCC_DbgTrace(("%s", __FUNCTION__));

    NPVariant npargs[2];
    ToUnsignedLong(plugin, id, npargs[0]);
    ToHostObject<SessionOptsHost>(plugin, opts, npargs[1]);

    NPVariant result = NPVARIANT_VOID;
    NPN_InvokeDefault(plugin->npp, objectValue, npargs, 2, &result);
    NPN_ReleaseVariantValue(&result);

    NPN_ReleaseVariantValue(&npargs[1]);
}

