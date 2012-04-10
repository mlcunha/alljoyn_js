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
#include "../../FeaturePermissions.h"

#include "../../PluginData.h"
#include <qcc/Debug.h>
#include <qcc/FileStream.h>
#include <qcc/Util.h>

#define QCC_MODULE "ALLJOYN_JS"

QStatus RequestPermission(Plugin& plugin, const qcc::String& feature, RequestPermissionListener* listener)
{
    QCC_DbgTrace(("RequestPermission(feature=%s,listener=%p)", feature.c_str(), listener));

    QStatus status = ER_OK;
    int32_t level;
    qcc::String origin;

    status = PluginData::PermissionLevel(plugin, feature, level);
    if (ER_OK != status) {
        goto exit;
    }
    if (DEFAULT_DENIED != level) {
        listener->RequestPermissionCB(level, false);
        goto exit;
    }

    if (feature != ALLJOYN_FEATURE) {
        status = ER_FAIL;
        QCC_LogError(status, ("feature '%s' not supported", feature.c_str()));
        goto exit;
    }

    status = plugin->Origin(origin);
    if (ER_OK != status) {
        goto exit;
    }

    /*
     * TODO Implement the request permission dialog.
     */
    listener->RequestPermissionCB(DEFAULT_ALLOWED, false);

exit:
    return status;
}

QStatus PersistentPermissionLevel(Plugin& plugin, const qcc::String& origin, int32_t& level)
{
    /*
     * TODO Level should be DEFAULT_DENIED in a complete implementation.  See TODO above.
     */
    level = DEFAULT_ALLOWED;

    qcc::String filename = qcc::GetHomeDir() + "/.alljoyn_keystore/" + plugin->ToFilename(origin) + "_permission";
    QCC_DbgTrace(("filename=%s", filename.c_str()));
    qcc::FileSource source(filename);
    if (source.IsValid()) {
        source.Lock(true);
        qcc::String permission;
        source.GetLine(permission);
        source.Unlock();
        QCC_DbgHLPrintf(("Read permission '%s' from %s", permission.c_str(), filename.c_str()));
        qcc::String levelString = qcc::Trim(permission);
        if (levelString == "USER_ALLOWED") {
            level = USER_ALLOWED;
        } else if (levelString == "USER_DENIED") {
            level = USER_DENIED;
        } else if (levelString == "DEFAULT_ALLOWED") {
            level = DEFAULT_ALLOWED;
        }
    }
    return ER_OK;
}

QStatus SetPersistentPermissionLevel(Plugin& plugin, const qcc::String& origin, int32_t level)
{
    QStatus status = ER_OK;
    qcc::String filename = qcc::GetHomeDir() + "/.alljoyn_keystore/" + plugin->ToFilename(origin) + "_permission";
    qcc::FileSink sink(filename, qcc::FileSink::PRIVATE);
    if (sink.IsValid()) {
        sink.Lock(true);
        qcc::String permission;
        /*
         * Why the '\n' below?  FileSink doesn't truncate the existing file, so the line-break
         * ensures that we don't get any characters leftover from a previous write for a longer
         * string than the current one.
         */
        switch (level) {
        case USER_ALLOWED:
            permission = "USER_ALLOWED\n";
            break;

        case DEFAULT_ALLOWED:
            permission = "DEFAULT_ALLOWED\n";
            break;

        case DEFAULT_DENIED:
            permission = "DEFAULT_DENIED\n";
            break;

        case USER_DENIED:
            permission  = "USER_DENIED\n";
            break;
        }
        size_t bytesWritten;
        status = sink.PushBytes(permission.c_str(), permission.size(), bytesWritten);
        if (ER_OK == status) {
            if (permission.size() == bytesWritten) {
                QCC_DbgHLPrintf(("Wrote permission '%s' to %s", qcc::Trim(permission).c_str(), filename.c_str()));
            } else {
                status = ER_BUS_WRITE_ERROR;
                QCC_LogError(status, ("Cannot write permission to %s", filename.c_str()));
            }
        }
        sink.Unlock();
    } else {
        status = ER_BUS_WRITE_ERROR;
        QCC_LogError(status, ("Cannot write permission to %s", filename.c_str()));
    }
    return status;
}
