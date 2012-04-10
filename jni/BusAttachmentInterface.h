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
#ifndef _BUSATTACHMENTINTERFACE_H
#define _BUSATTACHMENTINTERFACE_H

#include "ScriptableObject.h"
#include <qcc/ManagedObj.h>

class _BusAttachmentInterface : public ScriptableObject {
  public:
    static std::map<NPIdentifier, int32_t>& Constants();
    _BusAttachmentInterface(Plugin& plugin);
    virtual ~_BusAttachmentInterface();
    virtual bool Construct(const NPVariant* args, uint32_t argCount, NPVariant* result);

  private:
    static std::map<NPIdentifier, int32_t> constants;
};

typedef qcc::ManagedObj<_BusAttachmentInterface> BusAttachmentInterface;

#endif // _BUSATTACHMENTINTERFACE_H
