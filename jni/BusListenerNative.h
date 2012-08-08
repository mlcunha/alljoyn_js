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
#ifndef _BUSLISTENERNATIVE_H
#define _BUSLISTENERNATIVE_H

#include "BusAttachmentHost.h"
#include "NativeObject.h"
#include <alljoyn/BusListener.h>
#include <qcc/String.h>

class BusListenerNative : public NativeObject {
  public:
    BusListenerNative(Plugin& plugin, NPObject* objectValue);
    virtual ~BusListenerNative();

    void onRegistered(BusAttachmentHost& busAttachment);
    void onUnregistered();
    void onFoundAdvertisedName(const qcc::String& name, ajn::TransportMask transport, const qcc::String& namePrefix);
    void onLostAdvertisedName(const qcc::String& name, ajn::TransportMask transport, const qcc::String& namePrefix);
    void onNameOwnerChanged(const qcc::String& busName, const qcc::String& previousOwner, const qcc::String& newOwner);
    void onPropertyChanged(const qcc::String& propName, const ajn::MsgArg* propValue);
    void onStopping();
    void onDisconnected();
};

#endif // _BUSLISTENERNATIVE_H
