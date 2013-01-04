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
#ifndef _BUSERRORINTERFACE_H
#define _BUSERRORINTERFACE_H

#include "ScriptableObject.h"
#include <qcc/ManagedObj.h>

class _BusErrorInterface : public ScriptableObject {
  public:
    static std::map<qcc::String, int32_t>& Constants();
    _BusErrorInterface(Plugin& plugin);
    virtual ~_BusErrorInterface();

  private:
    static std::map<qcc::String, int32_t> constants;
    bool getName(NPVariant* result);
    bool getMessage(NPVariant* result);
    bool getCode(NPVariant* result);
};

typedef qcc::ManagedObj<_BusErrorInterface> BusErrorInterface;

#endif // _BUSERRORINTERFACE_H
