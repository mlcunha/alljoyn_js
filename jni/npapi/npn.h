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
#ifndef _NPN_H
#define _NPN_H

#include <qcc/Thread.h>
#if defined(QCC_OS_LINUX)
#include <prtypes.h>
#endif
#include <npapi.h>
#include <npfunctions.h>
#include <npruntime.h>

#undef STRINGZ_TO_NPVARIANT
#define STRINGZ_TO_NPVARIANT(_val, _v)                  \
    NP_BEGIN_MACRO                                      \
        (_v).type = NPVariantType_String;               \
    NPString str = { _val, (uint32_t)strlen(_val) };    \
    (_v).value.stringValue = str;                       \
    NP_END_MACRO

#ifndef NPVARIANT_VOID
#define NPVARIANT_VOID { NPVariantType_Void, { 0 } }
#endif

extern qcc::Thread* gPluginThread;
#if defined(QCC_OS_GROUP_WINDOWS)
extern HINSTANCE gHinstance;
#endif

void NPN_RetainVariantValue(const NPVariant*variant, NPVariant* retained);
void NPN_PluginThreadAsyncCall(NPP instance, void (*func)(void*), void* userData);

#endif // _NPN_H
