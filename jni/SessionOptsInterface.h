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
#ifndef _SESSIONOPTSINTERFACE_H
#define _SESSIONOPTSINTERFACE_H

#include "ScriptableObject.h"
#include <qcc/ManagedObj.h>

class _SessionOptsInterface : public ScriptableObject {
  public:
    static std::map<NPIdentifier, int32_t>& Constants();
    _SessionOptsInterface(Plugin& plugin);
    virtual ~_SessionOptsInterface();

  private:
    static std::map<NPIdentifier, int32_t> constants;
};

typedef qcc::ManagedObj<_SessionOptsInterface> SessionOptsInterface;

#endif // _SESSIONOPTSINTERFACE_H
