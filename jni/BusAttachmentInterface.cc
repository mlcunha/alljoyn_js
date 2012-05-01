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
#include "BusAttachmentInterface.h"

#include "BusAttachmentHost.h"
#include "FeaturePermissions.h"
#include "HostObject.h"
#include "TypeMapping.h"
#include <qcc/Debug.h>

#define QCC_MODULE "ALLJOYN_JS"

std::map<qcc::String, int32_t> _BusAttachmentInterface::constants;

std::map<qcc::String, int32_t>& _BusAttachmentInterface::Constants()
{
    if (constants.empty()) {
        CONSTANT("DBUS_NAME_FLAG_ALLOW_REPLACEMENT", 0x01);
        CONSTANT("DBUS_NAME_FLAG_REPLACE_EXISTING",  0x02);
        CONSTANT("DBUS_NAME_FLAG_DO_NOT_QUEUE",      0x04);

        CONSTANT("SESSION_PORT_ANY", 0);
    }
    return constants;
}

_BusAttachmentInterface::_BusAttachmentInterface(Plugin& plugin)
    : ScriptableObject(plugin, Constants())
{
    QCC_DbgTrace(("%s", __FUNCTION__));
}

_BusAttachmentInterface::~_BusAttachmentInterface()
{
    QCC_DbgTrace(("%s", __FUNCTION__));
}

bool _BusAttachmentInterface::Construct(const NPVariant* args, uint32_t argCount, NPVariant* result)
{
    QCC_DbgTrace(("%s", __FUNCTION__));

    QStatus status = ER_OK;
    bool typeError = false;
    int32_t level = 0;
    qcc::String applicationName;
    bool allowRemoteMessages = false;

    /*
     * Check permission level first.
     */
    status = PluginData::PermissionLevel(plugin, ALLJOYN_FEATURE, level);
    if (ER_OK != status) {
        status = ER_OK;
        level = 0;
    }
    if (level <= 0) {
        typeError = true;
        plugin->RaiseTypeError("permission denied");
        goto exit;
    }

    status = plugin->Origin(applicationName);
    if (ER_OK != status) {
        goto exit;
    }
    if (argCount > 0) {
        allowRemoteMessages = ToBoolean(plugin, args[0], typeError);
        if (typeError) {
            plugin->RaiseTypeError("argument 0 is not a boolean");
            goto exit;
        }
    }

    {
        qcc::String name = plugin->ToFilename(applicationName);
        const char* cname = name.c_str();
        BusAttachmentHost busAttachmentHost(plugin, cname, allowRemoteMessages);
        ToHostObject<BusAttachmentHost>(plugin, busAttachmentHost, *result);
    }

exit:
    if ((ER_OK == status) && !typeError) {
        return true;
    } else {
        if (ER_OK != status) {
            plugin->RaiseBusError(status);
        }
        return false;
    }
}
