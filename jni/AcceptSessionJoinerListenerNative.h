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
#ifndef _ACCEPTSESSIONJOINERLISTENERNATIVE_H
#define _ACCEPTSESSIONJOINERLISTENERNATIVE_H

#include "NativeObject.h"
#include "SessionOptsHost.h"
#include <qcc/String.h>

class AcceptSessionJoinerListenerNative : public NativeObject {
  public:
    AcceptSessionJoinerListenerNative(Plugin& plugin, NPObject* objectValue);
    virtual ~AcceptSessionJoinerListenerNative();

    bool onAccept(ajn::SessionPort port, const qcc::String& joiner, SessionOptsHost& opts);
};

#endif // _ACCEPTSESSIONJOINERLISTENERNATIVE_H
