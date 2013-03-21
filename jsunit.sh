# Copyright 2013, Qualcomm Innovation Center, Inc.
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

function cleanup {
  killall -1 chrome 
  kill -1 $JAVASERVERPID $ALLJOYNDAEMONPID 
  s
  killall -9 chrome
  kill -9 $JAVASERVERPID $ALLJOYNDAEMONPID 
  s
}

function s {
  if [ "$1" == "" ] ; then
    for i in {1..3}
    do
      sleep 1
      echo -n .
    done
  else
    for i in $(eval echo "{1..$1}");
    do
      sleep 1
      echo -n .
    done
  fi
  echo .
}

function startservers {
  java -jar /opt/JsTestDriver/JsTestDriver.jar --port 4224 --browserTimeout 90000 &
  JAVASERVERPID=$!
  $INSTALLDIR/dist/bin/alljoyn-daemon &
  ALLJOYNDAEMONPID=$!
  s
}

function startbrowsers {
  google-chrome --load-plugin=$INSTALLDIR/dist/js/lib/libnpalljoyn.so http://localhost:4224/capture &
  s 10
}

function executetests {
  echo TEST OF $1 BEGINS
  java -jar /opt/JsTestDriver/JsTestDriver.jar --config jsTestDriver-npapi.conf --tests $1 --testOutput $TESTDIR
  s
  echo TEST OF $1 ENDS
}

function testjs {
  startservers
  startbrowsers
  executetests $1
  cleanup
}

function results {
  NF=`grep \<testsuite $TESTDIR/*xml |grep -v  failures=\"0\" | wc -l`
  if [ "$NF" -ne "0" ] ; then
    echo FAILFAILFAIL Some tests failed.
    exit 1
  else
    echo WINWINWIN No tests failed.
    exit 0
  fi
}

echo TESTING BEGINS
if [ "$1" == "" ] ; then
  echo MISSING ARGUMENT
  exit 1
fi

INSTALLDIR=$1

if [ ! -d "$INSTALLDIR" ]; then
  echo INSTALLDIR $INSTALLDIR is not a directory
  exit 1
fi

LD_LIBRARY_PATH=$INSTALLDIR/dist/lib
export LD_LIBRARY_PATH

TESTDIR=$INSTALLDIR/testOutput

mkdir $TESTDIR

if [ ! -d "$TESTDIR" ]; then
  echo TESTDIR $TESTDIR is not a directory
  exit 1
fi

# Disabled tests.
# SessionTest,SimpleTest,MarshalTest
for tn in AddressBookTest,AuthListenerTest,BusAttachmentArgCountTest \
          BusAttachmentHelpersTest,BusAttachmentTest,BusErrorTest \
          BusListenerTest,BusObjectTest,ConstantsTest \
          GameTest,InterfaceDescriptionTest,KeyStoreTest \
          MessageArgCountTest,MessageTest,PropsTest \
          ProxyBusObjectArgCountTest,ProxyBusObjectTest \
          ProxyInterfaceTest,ProxyMethodArgCountTest,ProxyMethodTest \
          RequestPermission,SocketFdArgCountTest,SocketFdTest,VersionTest;
do
  testjs $tn
done
echo TESTING ENDS

cleanup
results
