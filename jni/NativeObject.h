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
#ifndef _NATIVEOBJECT_H
#define _NATIVEOBJECT_H

#include "Plugin.h"

class NativeObject {
  public:
    /**
     * Retains a reference to an existing NPObject*.
     */
    NativeObject(Plugin& plugin, NPObject* objectValue);
    /**
     * Creates a new NPObject* by calling "new Object();".
     */
    NativeObject(Plugin& plugin);
    virtual ~NativeObject();

    virtual void Invalidate();
    bool operator==(const NativeObject& that) const;

    Plugin plugin;
    NPObject* objectValue;
};

#endif // _NATIVEOBJECT_H
