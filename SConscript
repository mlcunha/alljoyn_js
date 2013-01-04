# Copyright 2010 - 2011, Qualcomm Innovation Center, Inc.
# 
#    Licensed under the Apache License, Version 2.0 (the "License");
#    you may not use this file except in compliance with the License.
#    You may obtain a copy of the License at
# 
#        http://www.apache.org/licenses/LICENSE-2.0
# 
#    Unless required by applicable law or agreed to in writing, software
#    distributed under the License is distributed on an "AS IS" BASIS,
#    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#    See the License for the specific language governing permissions and
#    limitations under the License.
# 

import os
import subprocess
import sys
import time

Import('env')

vars = Variables()
vars.Add(PathVariable('CORDOVA_BASE', 'Base directory of Cordova (aka PhoneGap)', os.environ.get('CORDOVA_BASE')))
vars.Add(PathVariable('GECKO_BASE', 'Base directory of Gecko SDK', os.environ.get('GECKO_BASE')))
vars.Add(PathVariable('WIDLPROC', 'Path to widlproc executable', os.environ.get('WIDLPROC')))
vars.Add(PathVariable('XSLTPROC', 'Path to xsltproc executable', 'xsltproc', PathVariable.PathAccept))
vars.Update(env)

Help(vars.GenerateHelpText(env))
if '' == env.subst('$GECKO_BASE') and '' == env.subst('$CORDOVA_BASE'):
    print 'Must specify either GECKO_BASE or CORDOVA_BASE build variable'
    if not GetOption('help'):
        Exit()

# Dependent Projects
if not env.has_key('_ALLJOYNCORE_'):
    env.SConscript('../alljoyn_core/SConscript')

sys.path.append('../build_core/tools/scons')
from jsstatus import JavaScriptStatus
from widl import Widl

if(not(env.has_key('BULLSEYE_BIN'))):
    print('BULLSEYE_BIN not specified')
else:
    env.PrependENVPath('PATH', env.get('BULLSEYE_BIN'))

# add support for NPAPI plugins
env.MergeFlags(['-D__STDC_LIMIT_MACROS'])
if env['OS_CONF'] == 'windows':
    env.MergeFlags(['-D_WINDOWS -DWIN32'])
    if env['CPU'] == 'IA64':
        env.MergeFlags(['-DWIN64'])
elif env['OS_CONF'] == 'linux':
    env.ParseConfig('pkg-config gtk+-2.0 --cflags --libs') # TODO

# TODO
# LOCAL_CFLAGS += -fvisibility=hidden
# LOCAL_PRELINK_MODULE:=false

# Make alljoyn_js dist a sub-directory of the alljoyn dist.  This avoids any conflicts with alljoyn dist targets.
env['JS_DISTDIR'] = env['DISTDIR'] + '/js'

# Add support for mulitiple build targets in the same workset
env.VariantDir('$OBJDIR/jni', 'jni', duplicate = 0)

# AllJoyn JavaScript status codes
JavaScriptStatus('jni/Status.xml', 'jni/BusErrorInterface.cc')

# AllJoyn plugin library
libs = env.SConscript('$OBJDIR/jni/SConscript')
if '' != env.subst('$GECKO_BASE'):
    env.Install('$JS_DISTDIR/lib', libs)
else:
    env.Install('$JS_DISTDIR/libs/armeabi', libs)

# AllJoyn Cordova plugin - Java side
if '' != env.subst('$CORDOVA_BASE'):
    alljoyn_jar = env.SConscript('src/SConscript')

# AllJoyn samples
env.SConscript('samples/SConscript')

# Plugin distributions
if '' != env.subst('$GECKO_BASE'):
    if env['OS_CONF'] == 'windows':
        env.Install('$JS_DISTDIR/plugin', ['alljoyn64.reg', 'alljoyn.reg', '$JS_DISTDIR/lib/npalljoyn.dll'])
# TODO
#    Widl('assets/www/alljoyn.js.in', 'jni/Status.xml', 'assets/www/alljoyn.js')
#    env.Install('$JS_DISTDIR/assets/www', 'assets/www/alljoyn.js')
