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
#ifndef _FEATUREPERMISSIONS_H
#define _FEATUREPERMISSIONS_H

#include "Plugin.h"
#include "Status.h"

/*
 * Feature identifiers.
 */
#define ALLJOYN_FEATURE "org.alljoyn.bus"

/*
 * Permission levels.
 */
#define USER_ALLOWED 2
#define DEFAULT_ALLOWED 1
#define DEFAULT_DENIED -1
#define USER_DENIED -2

class RequestPermissionListener {
  public:
    virtual ~RequestPermissionListener() { }
    virtual void RequestPermissionCB(int32_t level, bool remember) = 0;
};

/**
 * @param listener called when the user allows or denies permission.  If this function returns ER_OK then
 *                 the listener must remain valid until its RequestPermissionCB() is called.
 */
QStatus RequestPermission(Plugin& plugin, const qcc::String& feature, RequestPermissionListener* listener);

QStatus PersistentPermissionLevel(Plugin& plugin, const qcc::String& origin, int32_t& level);
QStatus SetPersistentPermissionLevel(Plugin& plugin, const qcc::String& origin, int32_t level);

#endif // _FEATUREPERMISSIONS_H
