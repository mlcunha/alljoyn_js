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
#include "npn.h"

#include "PluginData.h"
#include "Status.h"
#include <qcc/Debug.h>
#include <qcc/Log.h>
#include <qcc/Thread.h>
#include <stdlib.h>
#include <string.h>

extern NPNetscapeFuncs* npn;

#define QCC_MODULE "ALLJOYN_JS"

/* This is only defined for XP_UNIX platforms in the Gecko SDK. */
#if !defined(NP_EXPORT)
#define NP_EXPORT(__type)  __type
#endif
/* This is not defined under Android. */
#if !defined(OSCALL)
#define OSCALL
#endif

/*
 * Different browsers call the exported functions in different orders, so the NP_ calls are littered
 * with this call.
 */
static void InitializeDebug()
{
    QCC_UseOSLogging(true);
    QCC_SetLogLevels("ALLJOYN_JS=15");
}

static NPError InitializePluginFuncs(NPPluginFuncs* pFuncs)
{
    if (!pFuncs) {
        QCC_LogError(ER_FAIL, ("Null NPPluginFuncs - NPERR_INVALID_FUNCTABLE_ERROR"));
        return NPERR_INVALID_FUNCTABLE_ERROR;
    }
    pFuncs->size = sizeof(NPPluginFuncs);
    pFuncs->version = (NP_VERSION_MAJOR << 8) | NP_VERSION_MINOR;
    pFuncs->newp = NPP_New;
    pFuncs->destroy = NPP_Destroy;
    pFuncs->setwindow =  NPP_SetWindow;
    pFuncs->newstream = NPP_NewStream;
    pFuncs->destroystream = NPP_DestroyStream;
    pFuncs->asfile = NPP_StreamAsFile;
    pFuncs->writeready = NPP_WriteReady;
    pFuncs->write = NPP_Write;
    pFuncs->print = NPP_Print;
    pFuncs->event = NPP_HandleEvent;
    pFuncs->urlnotify = NPP_URLNotify;
    pFuncs->javaClass = 0;
    pFuncs->getvalue = NPP_GetValue;
    pFuncs->setvalue = NPP_SetValue;
    return NPERR_NO_ERROR;
}

static NPError InitializeNetscapeFuncs(NPNetscapeFuncs* bFuncs)
{
    if (!bFuncs) {
        QCC_LogError(ER_FAIL, ("Null NPNetscapeFuncs - NPERR_INVALID_FUNCTABLE_ERROR"));
        return NPERR_INVALID_FUNCTABLE_ERROR;
    }
    if (((bFuncs->version >> 8) & 0xff) > NP_VERSION_MAJOR) {
        QCC_LogError(ER_FAIL, ("Incompatible version %d > %d - NPERR_INCOMPATIBLE_VERSION_ERROR",
                               (bFuncs->version >> 8) & 0xff, NP_VERSION_MAJOR));
        return NPERR_INCOMPATIBLE_VERSION_ERROR;
    }
    if (bFuncs->size < sizeof(NPNetscapeFuncs)) {
        QCC_LogError(ER_FAIL, ("NPNetscapeFuncs unexpected size %d < %d - NPERR_GENERIC_ERROR",
                               bFuncs->size, sizeof(NPNetscapeFuncs)));
        return NPERR_GENERIC_ERROR;
    }
    npn = (NPNetscapeFuncs*) malloc(sizeof(NPNetscapeFuncs));
    memcpy(npn, bFuncs, sizeof(NPNetscapeFuncs));
    return NPERR_NO_ERROR;
}

extern "C" {

NP_EXPORT(char*) NP_GetPluginVersion()
{
    InitializeDebug();
    QCC_DbgPrintf(("%s", __FUNCTION__));
    return const_cast<char*>("3.2.0");
}

NP_EXPORT(char*) NP_GetMIMEDescription()
{
    InitializeDebug();
    QCC_DbgPrintf(("%s", __FUNCTION__));
    /*
     * Be wary of changing this.  It appears that Android requires a non-empty description field.
     */
    return const_cast<char*>("application/x-alljoyn::AllJoyn");
}

NP_EXPORT(NPError) OSCALL NP_GetEntryPoints(NPPluginFuncs* pFuncs)
{
    InitializeDebug();
    QCC_DbgPrintf(("%s", __FUNCTION__));
    return InitializePluginFuncs(pFuncs);
}

#if defined(QCC_OS_GROUP_WINDOWS)
BOOL WINAPI DllMain(HINSTANCE hinstDLL, DWORD fdwReason, LPVOID lpvReserved)
{
    gHinstance = hinstDLL;
    return TRUE;
}

NP_EXPORT(NPError) OSCALL NP_Initialize(NPNetscapeFuncs* bFuncs)
{
    PluginData::InitializeStaticData();
    gPluginThread = qcc::Thread::GetThread();
    InitializeDebug();
    QCC_DbgPrintf(("%s", __FUNCTION__));
    return InitializeNetscapeFuncs(bFuncs);
}
#else
NP_EXPORT(NPError) OSCALL NP_Initialize(NPNetscapeFuncs* bFuncs, NPPluginFuncs* pFuncs)
{
    PluginData::InitializeStaticData();
    gPluginThread = qcc::Thread::GetThread();

    InitializeDebug();
    QCC_DbgPrintf(("%s", __FUNCTION__));

    NPError ret;
    ret = InitializeNetscapeFuncs(bFuncs);
    if (NPERR_NO_ERROR != ret) {
        return ret;
    }
    ret = InitializePluginFuncs(pFuncs);
    if (NPERR_NO_ERROR != ret) {
        return ret;
    }

    PRBool supportsXEmbed = PR_FALSE;
    ret = NPN_GetValue(NULL, NPNVSupportsXEmbedBool, &supportsXEmbed);
    if ((NPERR_NO_ERROR != ret) || !supportsXEmbed) {
        QCC_LogError(ER_FAIL, ("XEmbed is not supported"));
        return NPERR_INCOMPATIBLE_VERSION_ERROR;
    }

    NPNToolkitType toolkit = (NPNToolkitType)0;
    ret = NPN_GetValue(NULL, NPNVToolkit, &toolkit);
    if ((NPERR_NO_ERROR != ret) || (NPNVGtk2 != toolkit)) {
        QCC_LogError(ER_FAIL, ("Toolkit is not Gtk2"));
        return NPERR_INCOMPATIBLE_VERSION_ERROR;
    }

    return ret;
}
#endif

NP_EXPORT(NPError) OSCALL NP_Shutdown()
{
    QCC_DbgPrintf(("%s", __FUNCTION__));
    qcc::Thread::CleanExternalThreads();
    PluginData::DumpNPObjects();
    return NPERR_NO_ERROR;
}

NP_EXPORT(NPError) OSCALL NP_GetValue(void* future, NPPVariable variable, void* value)
{
    InitializeDebug();
    switch (variable) {
#if !defined(NDEBUG)
    case NPPVpluginNameString:
        QCC_DbgTrace(("%s(variable=%s)", __FUNCTION__, "NPPVpluginNameString"));
        break;

    case NPPVpluginDescriptionString:
        QCC_DbgTrace(("%s(variable=%s)", __FUNCTION__, "NPPVpluginDescriptionString"));
        break;

    case NPPVpluginWindowBool:
        QCC_DbgTrace(("%s(variable=%s)", __FUNCTION__, "NPPVpluginWindowBool"));
        break;

    case NPPVpluginTransparentBool:
        QCC_DbgTrace(("%s(variable=%s)", __FUNCTION__, "NPPVpluginTransparentBool"));
        break;

    case NPPVjavaClass:
        QCC_DbgTrace(("%s(variable=%s)", __FUNCTION__, "NPPVjavaClass"));
        break;

    case NPPVpluginWindowSize:
        QCC_DbgTrace(("%s(variable=%s)", __FUNCTION__, "NPPVpluginWindowSize"));
        break;

    case NPPVpluginTimerInterval:
        QCC_DbgTrace(("%s(variable=%s)", __FUNCTION__, "NPPVpluginTimerInterval"));
        break;

    case NPPVpluginScriptableInstance:
        QCC_DbgTrace(("%s(variable=%s)", __FUNCTION__, "NPPVpluginScriptableInstance"));
        break;

    case NPPVpluginScriptableIID:
        QCC_DbgTrace(("%s(variable=%s)", __FUNCTION__, "NPPVpluginScriptableIID"));
        break;

    case NPPVjavascriptPushCallerBool:
        QCC_DbgTrace(("%s(variable=%s)", __FUNCTION__, "NPPVjavascriptPushCallerBool"));
        break;

    case NPPVpluginKeepLibraryInMemory:
        QCC_DbgTrace(("%s(variable=%s)", __FUNCTION__, "NPPVpluginKeepLibraryInMemory"));
        break;

    case NPPVpluginNeedsXEmbed:
        QCC_DbgTrace(("%s(variable=%s)", __FUNCTION__, "NPPVpluginNeedsXEmbed"));
        break;

    case NPPVpluginScriptableNPObject:
        QCC_DbgTrace(("%s(variable=%s)", __FUNCTION__, "NPPVpluginScriptableNPObject"));
        break;

    case NPPVformValue:
        QCC_DbgTrace(("%s(variable=%s)", __FUNCTION__, "NPPVformValue"));
        break;

    case NPPVpluginUrlRequestsDisplayedBool:
        QCC_DbgTrace(("%s(variable=%s)", __FUNCTION__, "NPPVpluginUrlRequestsDisplayedBool"));
        break;

    case NPPVpluginWantsAllNetworkStreams:
        QCC_DbgTrace(("%s(variable=%s)", __FUNCTION__, "NPPVpluginWantsAllNetworkStreams"));
        break;

#ifdef XP_MACOSX
    case NPPVpluginDrawingModel:
        QCC_DbgTrace(("%s(variable=%s)", __FUNCTION__, "NPPVpluginDrawingModel"));
        break;
#endif

#if (MOZ_PLATFORM_MAEMO == 5)
    case NPPVpluginWindowlessLocalBool:
        QCC_DbgTrace(("%s(variable=%s)", __FUNCTION__, "NPPVpluginWindowlessLocalBool"));
        break;
#endif
#endif // !NDEBUG

    default:
        QCC_DbgTrace(("%s(variable=%d)", __FUNCTION__, variable));
        break;
    }

    NPError ret = NPERR_NO_ERROR;
    switch (variable) {
    case NPPVpluginNameString:
        *((const char** )value) = "AllJoyn";
        break;

    case NPPVpluginDescriptionString:
        *((const char** )value) = "AllJoyn browser plugin";
        break;

    default:
        ret = NPERR_GENERIC_ERROR;
        break;
    }
    return ret;
}

};
