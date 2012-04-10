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
#ifndef _ERRORLISTENERNATIVE_H
#define _ERRORLISTENERNATIVE_H

#include "BusErrorHost.h"
#include "NativeObject.h"

class ErrorListenerNative : public NativeObject {
  public:
    ErrorListenerNative(Plugin& plugin, NPObject* objectValue);
    virtual ~ErrorListenerNative();

    void onError(BusErrorHost& error);
};

#endif // _ERRORLISTENERNATIVE_H
