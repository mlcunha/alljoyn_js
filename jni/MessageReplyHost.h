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
#ifndef _MESSAGEREPLYHOST_H
#define _MESSAGEREPLYHOST_H

#include "BusAttachment.h"
#include "BusObject.h"
#include "MessageHost.h"
#include "ScriptableObject.h"
#include <alljoyn/Message.h>
#include <alljoyn/MsgArg.h>
#include <qcc/String.h>

class _MessageReplyHost : public _MessageHost {
  public:
    _MessageReplyHost(Plugin& plugin, BusAttachment& busAttachment, BusObject& busObject, ajn::Message& message, qcc::String replySignature);
    virtual ~_MessageReplyHost();

  private:
    BusObject busObject;
    qcc::String replySignature;

    bool reply(const NPVariant* npargs, uint32_t npargCount, NPVariant* npresult);
    bool replyError(const NPVariant* npargs, uint32_t npargCount, NPVariant* npresult);
};

typedef qcc::ManagedObj<_MessageReplyHost> MessageReplyHost;

#endif // _MESSAGEREPLYHOST_H
