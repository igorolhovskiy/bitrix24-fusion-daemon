#!/bin/bash

cp -f /freeswitch_config/acl.conf.xml /etc/freeswitch/autoload_configs/
cp -f /freeswitch_config/event_socket.conf.xml /etc/freeswitch/autoload_configs/
rm -f /etc/freeswitch/sip_profiles/external-ipv6.xml /etc/freeswitch/sip_profiles/internal-ipv6.xml

/usr/bin/freeswitch -nonat