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
#ifndef _SESSIONLOSTLISTENERNATIVE_H
#define _SESSIONLOSTLISTENERNATIVE_H

#include "NativeObject.h"
#include <alljoyn/SessionPortListener.h>
#include <qcc/String.h>

class SessionLostListenerNative : public NativeObject {
  public:
    SessionLostListenerNative(Plugin& plugin, NPObject* objectValue);
    virtual ~SessionLostListenerNative();

    void onLost(ajn::SessionId id);
};

#endif // _SESSIONLOSTLISTENERNATIVE_H
