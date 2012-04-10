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
#include "MessageListenerNative.h"

#include "MessageHost.h"
#include "TypeMapping.h"
#include <qcc/Debug.h>

#define QCC_MODULE "ALLJOYN_JS"

MessageListenerNative::MessageListenerNative(Plugin& plugin, NPObject* objectValue)
    : NativeObject(plugin, objectValue)
{
    QCC_DbgTrace(("%s", __FUNCTION__));
}

MessageListenerNative::~MessageListenerNative()
{
    QCC_DbgTrace(("%s", __FUNCTION__));
}

void MessageListenerNative::onMessage(MessageHost& message, const ajn::MsgArg* args, size_t numArgs)
{
    QCC_DbgTrace(("%s(args=%p,numArgs=%d)", __FUNCTION__, args, numArgs));
#if !defined(NDEBUG)
    qcc::String str = ajn::MsgArg::ToString(args, numArgs);
    QCC_DbgTrace(("%s", str.c_str()));
#endif

    QStatus status = ER_OK;
    uint32_t npargCount = 1 + numArgs;
    NPVariant* npargs = new NPVariant[npargCount];
    ToHostObject<MessageHost>(plugin, message, npargs[0]);
    size_t i;
    for (i = 0; (ER_OK == status) && (i < numArgs); ++i) {
        ToAny(plugin, args[i], npargs[1 + i], status);
    }

    NPVariant result = NPVARIANT_VOID;
    if (ER_OK == status) {
        if (!NPN_InvokeDefault(plugin->npp, objectValue, npargs, npargCount, &result)) {
            status = ER_FAIL;
            QCC_LogError(status, ("NPN_InvokeDefault failed"));
        }
    } else {
        npargCount = 1 + i;
    }

    for (uint32_t j = 0; j < npargCount; ++j) {
        NPN_ReleaseVariantValue(&npargs[j]);
    }
    delete[] npargs;
    NPN_ReleaseVariantValue(&result);
}
