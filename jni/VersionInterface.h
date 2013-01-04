/*
 * Copyright 2011-2013, Qualcomm Innovation Center, Inc.
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
#ifndef _VERSIONINTERFACE_H
#define _VERSIONINTERFACE_H

#include "ScriptableObject.h"
#include <qcc/ManagedObj.h>

class _VersionInterface : public ScriptableObject {
  public:
    _VersionInterface(Plugin& plugin);
    virtual ~_VersionInterface();

  private:
    bool getBuildInfo(NPVariant* result);
    bool getNumericVersion(NPVariant* result);
    bool getArch(NPVariant* result);
    bool getApiLevel(NPVariant* result);
    bool getRelease(NPVariant* result);
    bool getVersion(NPVariant* result);
    //bool toString(const NPVariant* args, uint32_t npargCount, NPVariant* result);
};

typedef qcc::ManagedObj<_VersionInterface> VersionInterface;

#endif // _VERSIONINTERFACE_H
