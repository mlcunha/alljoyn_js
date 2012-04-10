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
#ifndef _MESSAGELISTENERNATIVE_H
#define _MESSAGELISTENERNATIVE_H

#include "MessageHost.h"
#include "NativeObject.h"
#include <alljoyn/MsgArg.h>

class MessageListenerNative : public NativeObject {
  public:
    MessageListenerNative(Plugin& plugin, NPObject* objectValue);
    virtual ~MessageListenerNative();

    void onMessage(MessageHost& message, const ajn::MsgArg* args, size_t numArgs);
};

#endif // _MESSAGELISTENERNATIVE_H
