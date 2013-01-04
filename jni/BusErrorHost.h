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
#ifndef _BUSERRORHOST_H
#define _BUSERRORHOST_H

#include "ScriptableObject.h"
#include "Status.h"
#include <qcc/ManagedObj.h>
#include <qcc/String.h>

class _BusErrorHost : public ScriptableObject {
  public:
    _BusErrorHost(Plugin& plugin, const qcc::String& name, const qcc::String& message, QStatus code);
    _BusErrorHost(Plugin& plugin, QStatus code);
    virtual ~_BusErrorHost();
    qcc::String ToString();

  private:
    const qcc::String name;
    const qcc::String message;
    QStatus code;

    bool getName(NPVariant* result);
    bool getMessage(NPVariant* result);
    bool getCode(NPVariant* result);
};

typedef qcc::ManagedObj<_BusErrorHost> BusErrorHost;

#endif // _BUSERRORHOST_H
